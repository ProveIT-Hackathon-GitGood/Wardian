import argparse
import os
import sys
import json
import joblib
import polars as pl
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from colorama import Fore, Style, init

# Init colorama for pretty CLI output
init(autoreset=True)

# ---------------------------------------------------------------------------
# Setup paths & Imports
# ---------------------------------------------------------------------------
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPTS_DIR, "..")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_FILE = os.path.join(BASE_DIR, "Dataset.csv")

# Add src to sys.path
sys.path.append(os.path.join(BASE_DIR, "src"))
from features import run_pipeline, VITALS, LABS

def load_prediction_assets():
    """Loads the model, feature list, and SHAP explainer."""
    model_path = os.path.join(ARTIFACTS_DIR, "xgb_sepsis_model.json")
    feat_path = os.path.join(ARTIFACTS_DIR, "feature_columns.json")
    thresh_path = os.path.join(ARTIFACTS_DIR, "threshold_sweep.json")
    explainer_path = os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib")

    if not all(os.path.exists(p) for p in [model_path, feat_path, thresh_path, explainer_path]):
        print(f"{Fore.RED}Error: Artifacts missing in {ARTIFACTS_DIR}. Please run train.py first.")
        sys.exit(1)

    model = XGBClassifier()
    model.load_model(model_path)

    with open(feat_path, "r") as f:
        feature_cols = json.load(f)

    with open(thresh_path, "r") as f:
        threshold = json.load(f).get("best_threshold", 0.5)

    explainer = joblib.load(explainer_path)
    
    return model, feature_cols, threshold, explainer

def get_patient_history(patient_id: str):
    """
    Retrieves the last 24 hours of history for a patient 
    before SepsisLabel hits 1 (or the end of their stay).
    """
    print(f"Loading history for Patient {patient_id} from {DATA_FILE}...")
    
    # Use scan for efficiency
    df = pl.scan_csv(DATA_FILE, schema_overrides={"Patient_ID": pl.String}).filter(pl.col("Patient_ID") == patient_id).collect()
    
    if df.height == 0:
        print(f"{Fore.RED}Error: Patient {patient_id} not found in dataset.")
        sys.exit(1)
        
    df = df.sort("Hour")
    
    # Find onset (first hour where SepsisLabel == 1)
    sepsis_indices = np.where(df["SepsisLabel"] == 1)[0]
    
    if len(sepsis_indices) > 0:
        onset_idx = sepsis_indices[0]
        # We take history UP TO BUT NOT INCLUDING the onset hour
        history_df = df.head(onset_idx)
    else:
        # Patient is always safe, take their entire history
        history_df = df
        
    # Model uses rolling 4h, 8h, 12h, 24h. Let's keep at least the last 24 rows.
    if history_df.height > 24:
        history_df = history_df.tail(24)
        
    return history_df

def run_mock_simulation(args):
    # 1. Load Assets
    model, feature_cols, threshold, explainer = load_prediction_assets()
    
    # 2. Extract History
    history_df = get_patient_history(args.id)
    last_row = history_df.tail(1).to_dicts()[0]
    last_prob_val = 0.0 # Placeholder for delta calculation
    
    # 3. Calculate "Baseline" Probability (before the mock update)
    if history_df.height >= 4: # Need some history for features to work
        baseline_processed = run_pipeline(history_df)
        X_base = baseline_processed.tail(1).select(feature_cols).to_pandas().values.astype(np.float32)
        X_base = np.nan_to_num(X_base, nan=0.0)
        last_prob_val = float(model.predict_proba(X_base)[0, 1])

    # 4. Construct New Row (Carry-Forward Logic)
    new_hour = last_row["Hour"] + 1
    new_row_dict = last_row.copy()
    new_row_dict["Hour"] = new_hour
    new_row_dict["ICULOS"] = float(new_hour)
    
    # Explicit User Overrides
    arg_dict = vars(args)
    overrides = []
    for col in VITALS + LABS:
        cli_val = arg_dict.get(col.lower())
        if cli_val is not None:
            new_row_dict[col] = cli_val
            overrides.append(col)
            
    if overrides:
        print(f"{Fore.CYAN}Applying Mock Update for Hour {int(new_hour)} with overrides: {', '.join(overrides)}")
    else:
        print(f"{Fore.YELLOW}Applying Mock Update for Hour {int(new_hour)} (No overrides provided, using carry-forward).")

    # 5. Combine and Process
    new_row_df = pl.DataFrame([new_row_dict])
    # Ensure types match
    new_row_df = new_row_df.with_columns([
        pl.col(c).cast(history_df.schema[c]) for c in new_row_df.columns
    ])
    combined_df = pl.concat([history_df, new_row_df])
    
    # Run full feature engineering
    processed_df = run_pipeline(combined_df)
    
    # 6. Predict
    inference_row = processed_df.tail(1).select(feature_cols)
    X = inference_row.to_pandas().values.astype(np.float32)
    X = np.nan_to_num(X, nan=0.0)
    
    prob = float(model.predict_proba(X)[0, 1])
    is_sepsis = prob >= threshold
    delta = prob - last_prob_val
    
    # 7. SHAP Drivers
    shap_values = explainer.shap_values(X)
    if isinstance(shap_values, list): shap_values = shap_values[1] # Binary class 1
    
    feat_impact = sorted(zip(feature_cols, shap_values[0]), key=lambda x: abs(x[1]), reverse=True)

    # 8. Render Results
    print("\n" + "="*80)
    print(f" WARDIAN ML: UI MOCK PREDICTION REPORT (Patient {args.id} @ Hr {int(new_hour)})")
    print("="*80)
    
    status_color = Fore.RED if is_sepsis else Fore.GREEN
    trend_color = Fore.RED if delta > 0.05 else (Fore.GREEN if delta < -0.05 else Fore.WHITE)
    trend_symbol = "+" if delta > 0 else "-"
    
    print(f" SEPSIS STATUS:   {status_color}{('POSITIVE' if is_sepsis else 'NEGATIVE'):<15} {Style.RESET_ALL} (Threshold: {threshold:.3f})")
    print(f" PROBABILITY:     {status_color}{prob*100:6.2f}% {Style.RESET_ALL}")
    print(f" RISK DELTA:      {trend_color}{trend_symbol} {abs(delta)*100:6.2f}% {Style.RESET_ALL} (vs prev hour)")
    
    print("\n--- TOP 5 CLINICAL DRIVERS (SHAP) ---")
    print(f"{'Feature':<35} | {'Impact'}")
    print("-" * 50)
    for f_name, f_val in feat_impact[:5]:
        color = Fore.RED if f_val > 0 else Fore.BLUE
        impact = "STRESSING" if f_val > 0 else "PROTECTIVE"
        print(f"{f_name:<35} | {color}{impact} ({f_val:.4f}){Style.RESET_ALL}")
    
    if is_sepsis:
        print(f"\n{Fore.RED}{Style.BRIGHT}>>> ALERT: SEPSIS TRIGGERED. INITIATE CLINICAL WORKUP IMMEDIATELY.")
    elif delta > 0.10:
        print(f"\n{Fore.YELLOW}{Style.BRIGHT}>>> CAUTION: RAPID CLINICAL DETERIORATION DETECTED.")
    print("="*80)

def main():
    parser = argparse.ArgumentParser(description="Wardian ML UI Mock Tester: Simulate clinical updates and track risk.")
    
    # Required
    parser.add_argument("--id", type=str, required=True, help="Patient ID (e.g. 'P000654' or just '654')")
    
    # Vitals (Must be lowercase in CLI, mapped to uppercase in logic)
    vital_grp = parser.add_argument_group("Vitals (Real-time)")
    for v in VITALS:
        vital_grp.add_argument(f"--{v.lower()}", type=float, help=f"Override {v}")
        
    # Labs (Selected important ones first)
    lab_grp = parser.add_argument_group("Laboratory Panel")
    for l in LABS:
        lab_grp.add_argument(f"--{l.lower()}", type=float, help=f"Override {l}")
        
    args = parser.parse_args()
    
    # Normalize ID to 6-digit string
    args.id = args.id.lower().replace('p', '').zfill(6)
        
    run_mock_simulation(args)

if __name__ == "__main__":
    main()
