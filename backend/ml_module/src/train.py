"""
Sprint 4: Model Training & Validation
--------------------------------------
Trains an XGBClassifier on the engineered features from Sprint 2,
evaluates with the custom PhysioNet Utility Score from Sprint 3,
uses GroupKFold on hospital unit identifiers, and generates SHAP explanations.
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
import polars as pl
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import GroupKFold

# Ensure src is importable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from src.data_loader import load_data
from src.features import run_pipeline, VITALS, LABS
from src.metrics import compute_physionet_utility


# ---------------------------------------------------------------------------
# 1. Feature column discovery
# ---------------------------------------------------------------------------

def get_feature_columns(df_pd: pd.DataFrame) -> list:
    """
    Returns the list of numeric feature columns to feed into XGBoost.
    Excludes identifiers, target, and non-feature administrative columns.
    """
    exclude = {
        "", "Unnamed: 0", "Patient_ID", "Hour", "SepsisLabel",
        "Unit1", "Unit2", "HospAdmTime", "ICULOS", "Gender", "Age"
    }
    # Keep Age and Gender as features — they are clinically relevant
    feature_cols = [
        c for c in df_pd.columns
        if c not in exclude and (
            pd.api.types.is_numeric_dtype(df_pd[c])
        )
    ]
    # Re-add Age, Gender, and ICULOS explicitly
    for col in ["Age", "Gender", "ICULOS"]:
        if col in df_pd.columns and col not in feature_cols:
            feature_cols.append(col)
    return sorted(feature_cols)


# ---------------------------------------------------------------------------
# 2. Group label construction
# ---------------------------------------------------------------------------

def build_group_labels(df_pd: pd.DataFrame) -> np.ndarray:
    """
    Creates a group label for GroupKFold from Unit1/Unit2 columns.

    Strategy:
      - Unit1=1, Unit2=0 → group 0  (MICU)
      - Unit1=0, Unit2=1 → group 1  (SICU)
      - Both NaN          → group 2  (Unknown / Hospital B)

    This yields ≥ 3 groups for GroupKFold splitting.
    """
    groups = np.full(len(df_pd), 2, dtype=int)  # default = unknown
    groups[(df_pd["Unit1"] == 1.0) & (df_pd["Unit2"] == 0.0)] = 0
    groups[(df_pd["Unit1"] == 0.0) & (df_pd["Unit2"] == 1.0)] = 1
    return groups


# ---------------------------------------------------------------------------
# 3. Dynamic scale_pos_weight calculation
# ---------------------------------------------------------------------------

def calc_scale_pos_weight(y: np.ndarray) -> float:
    """
    Computes scale_pos_weight = n_negative / n_positive.
    """
    n_pos = np.sum(y == 1)
    n_neg = np.sum(y == 0)
    weight = n_neg / n_pos if n_pos > 0 else 1.0
    return weight


# ---------------------------------------------------------------------------
# 4. Main training routine
# ---------------------------------------------------------------------------

def train(
    data_path: str,
    output_dir: str = "artifacts",
    n_splits: int = 3,
    threshold: float = 0.50,
):
    """
    End-to-end training pipeline:
      1. Load data  (Sprint 1)
      2. Engineer features  (Sprint 2)
      3. GroupKFold cross-validation with XGBoost
      4. Evaluate with PhysioNet Utility Score  (Sprint 3)
      5. Train final model on all data & generate SHAP values
    """
    os.makedirs(output_dir, exist_ok=True)
    t0 = time.time()

    # ── Step 1 & 2: Load and Feature Engineering (with Caching) ───────────
    print("=" * 60)
    print("STEP 1 & 2 / 5 — Loading dataset & Feature engineering")
    print("=" * 60)
    
    cache_path = os.path.join(os.path.dirname(data_path), "engineered_features.parquet")
    if os.path.exists(cache_path):
        print(f"Loading cached features from {cache_path}...")
        t_cache = time.time()
        df = pl.read_parquet(cache_path)
        print(f"Loaded cache in {time.time() - t_cache:.2f}s")
    else:
        df = load_data(data_path)
        df = run_pipeline(df)
        print(f"Saving features to cache at {cache_path}...")
        df.write_parquet(cache_path)

    # Convert to pandas for sklearn / xgboost
    df_pd = df.to_pandas()

    # ── Target Shifting ───────────────────────────────────────────────────
    print("  Applying Target Shifting (rolling SepsisLabel back by 6 hours)...")
    # Shift labels backward by 6 hours so XGBoost logloss aligns with PhysioNet Utility reward window
    shifted_labels = df_pd.groupby("Patient_ID")["SepsisLabel"].transform(
        lambda x: x.replace(0, np.nan).bfill(limit=6).fillna(0)
    )

    # ── Prepare X, y, groups ──────────────────────────────────────────────
    feature_cols = get_feature_columns(df_pd)
    print(f"\nUsing {len(feature_cols)} features.")

    X = df_pd[feature_cols].values.astype(np.float32)
    y = shifted_labels.values.astype(int)
    groups = build_group_labels(df_pd)

    # Replace any remaining NaN / inf with 0 for XGBoost safety
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    unique_groups = np.unique(groups)
    print(f"Group distribution: { {int(g): int(np.sum(groups == g)) for g in unique_groups} }")
    print(f"Class distribution: 0={int(np.sum(y==0)):,}  1={int(np.sum(y==1)):,}")

    # ── Step 3: GroupKFold Cross-Validation + Threshold Optimisation ─────
    print("\n" + "=" * 60)
    print(f"STEP 3 / 5 -- {n_splits}-Fold GroupKFold Cross-Validation")
    print("=" * 60)

    gkf = GroupKFold(n_splits=n_splits)

    # Collect all OOF (out-of-fold) probabilities for threshold sweep
    oof_probs = np.zeros(len(y), dtype=np.float32)
    oof_mask  = np.zeros(len(y), dtype=bool)

    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
        print(f"\n--- Fold {fold_idx + 1}/{n_splits} ---")
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        spw = calc_scale_pos_weight(y_train)
        print(f"  scale_pos_weight = {spw:.2f}")

        clf = XGBClassifier(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            scale_pos_weight=spw,
            min_child_weight=5,      # prevents overfitting to rare positive cases
            subsample=0.8,           # row sampling for regularisation
            colsample_bytree=0.8,    # feature sampling for regularisation
            max_delta_step=1,        # stabilises gradients for extreme imbalance
            eval_metric="logloss",
            tree_method="hist",
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        # Predict raw probabilities
        y_prob_raw = clf.predict_proba(X_val)[:, 1]

        # Apply 3-hour rolling mean smoothing to stabilize predictions
        val_df = df_pd.iloc[val_idx][["Patient_ID", "Hour", "SepsisLabel"]].copy()
        val_df["Raw_Prob"] = y_prob_raw
        val_df["Smooth_Prob"] = val_df.groupby("Patient_ID")["Raw_Prob"].transform(
            lambda x: x.rolling(3, min_periods=1).mean()
        )
        
        y_prob = val_df["Smooth_Prob"].values
        oof_probs[val_idx] = y_prob
        oof_mask[val_idx] = True

        # Quick per-fold score at default threshold
        y_pred_default = (y_prob >= threshold).astype(int)
        val_df["Prediction"] = y_pred_default
        val_df["SepsisLabel"] = val_df["SepsisLabel"].astype(int)
        u_default = compute_physionet_utility(val_df)
        print(f"  Utility @ threshold={threshold:.2f} (smoothed): {u_default:.4f}")

    # ── Threshold optimisation sweep ──────────────────────────────────────
    print("\n--- Threshold Optimisation (OOF) ---")
    oof_df = df_pd.loc[oof_mask, ["Patient_ID", "Hour", "SepsisLabel"]].copy()
    oof_df["SepsisLabel"] = oof_df["SepsisLabel"].astype(int)
    oof_p = oof_probs[oof_mask]

    thresholds = np.arange(0.10, 0.91, 0.05)
    best_thresh, best_utility = threshold, -999.0
    sweep_results = []

    for t in thresholds:
        oof_df["Prediction"] = (oof_p >= t).astype(int)
        u = compute_physionet_utility(oof_df)
        sweep_results.append({"threshold": round(float(t), 2), "utility": round(u, 4)})
        flag = ""
        if u > best_utility:
            best_utility = u
            best_thresh = round(float(t), 2)
            flag = "  <-- best"
        print(f"  threshold={t:.2f}  utility={u:.4f}{flag}")

    print(f"\n>> Best threshold: {best_thresh}  |  Best OOF Utility: {best_utility:.4f}")

    # Save threshold sweep for review
    sweep_path = os.path.join(output_dir, "threshold_sweep.json")
    with open(sweep_path, "w") as f:
        json.dump({"best_threshold": best_thresh, "sweep": sweep_results}, f, indent=2)

    # Build fold_results with the optimised threshold for the report
    fold_results = []
    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
        val_df = df_pd.iloc[val_idx][["Patient_ID", "Hour", "SepsisLabel"]].copy()
        val_df["Prediction"] = (oof_probs[val_idx] >= best_thresh).astype(int)
        val_df["SepsisLabel"] = val_df["SepsisLabel"].astype(int)
        u = compute_physionet_utility(val_df)
        fold_results.append({
            "fold": fold_idx + 1,
            "train_size": len(train_idx),
            "val_size": len(val_idx),
            "threshold": best_thresh,
            "utility_score": round(u, 4),
        })

    avg_utility = np.mean([r["utility_score"] for r in fold_results])
    print(f">> Mean Utility @ best threshold across folds: {avg_utility:.4f}")

    # ── Step 4: Final model on all data ───────────────────────────────────
    print("\n" + "=" * 60)
    print("STEP 4 / 5 — Training final model on full dataset")
    print("=" * 60)

    spw_full = calc_scale_pos_weight(y)
    final_model = XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=spw_full,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.8,
        max_delta_step=1,
        eval_metric="logloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )
    final_model.fit(X, y, verbose=False)

    model_path = os.path.join(output_dir, "xgb_sepsis_model.json")
    final_model.save_model(model_path)
    print(f"  Model saved -> {model_path}")

    # Save feature column list for inference reproducibility
    feat_path = os.path.join(output_dir, "feature_columns.json")
    with open(feat_path, "w") as f:
        json.dump(feature_cols, f, indent=2)
    print(f"  Feature list saved -> {feat_path}")

    # ── Step 5: SHAP Explainability ───────────────────────────────────────
    print("\n" + "=" * 60)
    print("STEP 5 / 5 — SHAP Explainability")
    print("=" * 60)

    import shap

    explainer = shap.TreeExplainer(final_model)

    # Compute SHAP on a subsample for speed (10 000 rows)
    shap_sample_size = min(10_000, X.shape[0])
    rng = np.random.RandomState(42)
    shap_idx = rng.choice(X.shape[0], shap_sample_size, replace=False)
    X_shap = X[shap_idx]

    print(f"  Computing SHAP values on {shap_sample_size:,} samples...")
    shap_values = explainer.shap_values(X_shap)

    # Global importance: mean |SHAP|
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    importance = sorted(
        zip(feature_cols, mean_abs_shap),
        key=lambda x: x[1],
        reverse=True,
    )

    top_n = 10
    print(f"\n  Top {top_n} SHAP Feature Importances:")
    for rank, (feat, val) in enumerate(importance[:top_n], 1):
        print(f"    {rank:>2}. {feat:<35s} {val:.6f}")

    # Save full importance ranking
    importance_path = os.path.join(output_dir, "shap_importance.json")
    with open(importance_path, "w") as f:
        json.dump(
            [{"feature": feat, "mean_abs_shap": round(float(val), 6)} for feat, val in importance],
            f, indent=2,
        )
    print(f"  SHAP importance saved -> {importance_path}")

    # Save explainer for later use in LLM alerting (Sprint 5)
    explainer_path = os.path.join(output_dir, "shap_explainer.joblib")
    joblib.dump(explainer, explainer_path)
    print(f"  SHAP explainer saved -> {explainer_path}")

    # ── Summary report ────────────────────────────────────────────────────
    elapsed = time.time() - t0
    report = {
        "total_rows": int(X.shape[0]),
        "total_features": len(feature_cols),
        "n_folds": n_splits,
        "best_threshold": best_thresh,
        "fold_results": fold_results,
        "mean_utility": round(avg_utility, 4),
        "top_3_shap_features": [importance[i][0] for i in range(min(3, len(importance)))],
        "elapsed_seconds": round(elapsed, 1),
    }
    report_path = os.path.join(output_dir, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Total time : {elapsed:.1f}s")
    print(f"  Mean Utility: {avg_utility:.4f}")
    print(f"  Top 3 drivers: {report['top_3_shap_features']}")
    print(f"  Artifacts  : {output_dir}/")

    return report


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(script_dir, "..", "Dataset.csv")
    artifact_dir = os.path.join(script_dir, "..", "artifacts")

    train(data_path=data_file, output_dir=artifact_dir)
