import os
import sys
import json
import numpy as np
import pandas as pd
import polars as pl
from xgboost import XGBClassifier
from datetime import datetime

# ---------------------------------------------------------------------------
# Setup paths & Imports
# ---------------------------------------------------------------------------
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SRC_DIR, "..")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_FILE = os.path.join(BASE_DIR, "Dataset.csv")

sys.path.append(BASE_DIR)
from src.features import run_pipeline

def load_assets():
    model_path = os.path.join(ARTIFACTS_DIR, "xgb_sepsis_model.json")
    feat_path = os.path.join(ARTIFACTS_DIR, "feature_columns.json")
    thresh_path = os.path.join(ARTIFACTS_DIR, "threshold_sweep.json")

    model = XGBClassifier()
    model.load_model(model_path)

    with open(feat_path, "r") as f:
        feature_cols = json.load(f)

    with open(thresh_path, "r") as f:
        threshold = json.load(f).get("best_threshold", 0.75)
    
    return model, feature_cols, threshold

def run_patient_analysis(sample_fraction=0.3):
    model, feature_cols, threshold = load_assets()

    print(f"Sampling {sample_fraction*100:.0f}% of patients from {DATA_FILE}...")
    
    # Get unique patient IDs and sample
    all_ids = pl.scan_csv(DATA_FILE).select("Patient_ID").unique().collect()
    num_total = len(all_ids)
    sample_ids = all_ids.sample(fraction=sample_fraction, seed=42)["Patient_ID"].to_list()
    num_sample = len(sample_ids)
    
    print(f"Loading timelines for {num_sample} patients...")
    df = pl.scan_csv(DATA_FILE).filter(pl.col("Patient_ID").is_in(sample_ids)).collect()
    
    print("Running feature engineering pipeline...")
    df_feat = run_pipeline(df)
    df_pd = df_feat.to_pandas()
    
    print("Generating model predictions...")
    X = df_pd[feature_cols].values.astype(np.float32)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    # Predict raw probabilities
    probs_raw = model.predict_proba(X)[:, 1]
    df_pd["Raw_Prob"] = probs_raw
    
    # Apply 3-hour smoothing (important: must be per patient)
    df_pd["Smooth_Prob"] = df_pd.groupby("Patient_ID")["Raw_Prob"].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )
    
    df_pd["Alarm"] = (df_pd["Smooth_Prob"] >= threshold).astype(int)
    
    # -----------------------------------------------------------------------
    # Clinical Metrics Logic
    # -----------------------------------------------------------------------
    print("Calculating clinical metrics...")
    
    # Aggegrate to Patient Level
    patient_stats = []
    
    grouped = df_pd.groupby("Patient_ID")
    for pid, group in grouped:
        has_sepsis = group["SepsisLabel"].any()
        had_alarm = group["Alarm"].any()
        
        lead_time = None
        if has_sepsis and had_alarm:
            # Sepsis clinical onset is where SepsisLabel becomes 1 + 6 hours
            # In training we shifted, but here we use original data.
            # Real clinical onset = First t where SepsisLabel == 1 + 6 (PhysioNet convention)
            onset_idx = np.where(group["SepsisLabel"] == 1)[0][0]
            onset_hour = group.iloc[onset_idx]["Hour"]
            clinical_t_sepsis = onset_hour + 6
            
            # First alarm hour
            alarm_idx = np.where(group["Alarm"] == 1)[0][0]
            alarm_hour = group.iloc[alarm_idx]["Hour"]
            
            lead_time = float(clinical_t_sepsis - alarm_hour)
        
        patient_stats.append({
            "Patient_ID": pid,
            "is_sepsis": bool(has_sepsis),
            "ever_alarmed": bool(had_alarm),
            "lead_time_hours": lead_time,
            "total_hours": len(group),
            "false_alarm_hours": int(group[(group["SepsisLabel"] == 0) & (group["Alarm"] == 1)].shape[0])
        })
    
    stats_df = pd.DataFrame(patient_stats)
    
    # --- 1. Patient Recall (Sensitivity) ---
    sepsis_patients = stats_df[stats_df["is_sepsis"]]
    patient_recall = sepsis_patients["ever_alarmed"].mean()
    
    # --- 2. Patient Precision (PPV) ---
    alarmed_patients = stats_df[stats_df["ever_alarmed"]]
    patient_precision = alarmed_patients["is_sepsis"].mean() if not alarmed_patients.empty else 0
    
    # --- 3. False Discovery Rate (FDR) ---
    patient_fdr = 1.0 - patient_precision
    
    # --- 4. Mean Lead Time ---
    mean_lead_time = sepsis_patients["lead_time_hours"].dropna().mean()
    
    # --- 5. False Alarms per 1,000 Patient Hours ---
    total_non_sepsis_hours = stats_df["total_hours"].sum() # Approx
    total_fa_hours = stats_df["false_alarm_hours"].sum()
    fa_per_1000 = (total_fa_hours / total_non_sepsis_hours) * 1000
    
    results = {
        "analysis_date": datetime.now().isoformat(),
        "sample_size_patients": int(num_sample),
        "sample_size_rows": int(len(df_pd)),
        "threshold": float(threshold),
        "metrics": {
            "patient_recall": round(float(patient_recall), 4),
            "patient_precision": round(float(patient_precision), 4),
            "patient_fdr_discovery_rate": round(float(patient_fdr), 4),
            "mean_lead_time_hours": round(float(mean_lead_time), 2),
            "false_alarms_per_1000_hours": round(float(fa_per_1000), 2)
        }
    }
    
    output_path = os.path.join(ARTIFACTS_DIR, "clinical_analysis.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "="*40)
    print("CLINICAL ANALYSIS COMPLETE")
    print("="*40)
    print(f"Patient-Level Recall    : {results['metrics']['patient_recall']:.2%}")
    print(f"Patient-Level Precision : {results['metrics']['patient_precision']:.2%}")
    print(f"False Discovery Rate    : {results['metrics']['patient_fdr_discovery_rate']:.2%}")
    print(f"Mean Lead Time (Hours) : {results['metrics']['mean_lead_time_hours']}h")
    print(f"False Alarms/1000 Hours: {results['metrics']['false_alarms_per_1000_hours']}")
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    run_patient_analysis(sample_fraction=0.3)
