import os
import sys
import json
import numpy as np
import pandas as pd
import polars as pl
import joblib
from xgboost import XGBClassifier
from colorama import Fore, Style, init

init(autoreset=True)

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
    print(f"{Fore.CYAN}Loading artifacts...{Style.RESET_ALL}")
    
    model_path = os.path.join(ARTIFACTS_DIR, "xgb_sepsis_model.json")
    feat_path = os.path.join(ARTIFACTS_DIR, "feature_columns.json")
    thresh_path = os.path.join(ARTIFACTS_DIR, "threshold_sweep.json")
    explainer_path = os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib")

    if not all(os.path.exists(p) for p in [model_path, feat_path, thresh_path, explainer_path]):
        print(f"{Fore.RED}Error: Artifacts missing. Please run train.py first.{Style.RESET_ALL}")
        sys.exit(1)

    model = XGBClassifier()
    model.load_model(model_path)

    with open(feat_path, "r") as f:
        feature_cols = json.load(f)

    with open(thresh_path, "r") as f:
        threshold = json.load(f).get("best_threshold", 0.5)

    explainer = joblib.load(explainer_path)

    print(f"  Model Loaded: {model_path}")
    print(f"  Features: {len(feature_cols)} cols")
    print(f"  Threshold: {threshold:.4f}")
    
    return model, feature_cols, threshold, explainer

def visualize_patient_behavior(patient_id: int):
    model, feature_cols, threshold, explainer = load_assets()

    print(f"\n{Fore.CYAN}Fetching data for Patient {patient_id}...{Style.RESET_ALL}")
    
    # Load and filter for specific patient
    df = pl.scan_csv(DATA_FILE).filter(pl.col("Patient_ID") == patient_id).collect()
    
    if df.height == 0:
        # Try finding a random sepsis patient if the selected one doesn't exist
        print(f"{Fore.YELLOW}Patient {patient_id} not found. Attempting to find a sepsis patient...{Style.RESET_ALL}")
        df_sepsis = pl.scan_csv(DATA_FILE).filter(pl.col("SepsisLabel") == 1).head(500).collect()
        if df_sepsis.height > 0:
            patient_id = df_sepsis["Patient_ID"][0]
            df = pl.scan_csv(DATA_FILE).filter(pl.col("Patient_ID") == patient_id).collect()
            print(f"{Fore.GREEN}Found Sepsis Patient {patient_id}.{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}No Sepsis patients found in dataset sample.{Style.RESET_ALL}")
            return

    # Run feature pipeline
    df_feat = run_pipeline(df)
    df_pd = df_feat.to_pandas()
    
    # Prepare X
    X = df_pd[feature_cols].values.astype(np.float32)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    # Predict Raw
    probs_raw = model.predict_proba(X)[:, 1]

    # Apply Smoothing (3-hour rolling mean)
    df_pd["Raw_Prob"] = probs_raw
    df_pd["Smooth_Prob"] = df_pd["Raw_Prob"].rolling(3, min_periods=1).mean()
    
    probs_smooth = df_pd["Smooth_Prob"].values
    labels = df_pd["SepsisLabel"].values
    hours = df_pd["Hour"].values

    # Determine PhysioNet Window (approximate: find first label=1 and look back 12h)
    has_sepsis = np.any(labels == 1)
    onset_hour = -1
    if has_sepsis:
        # Challenge onset is t_sepsis - 6. Let's find first label=1.
        onset_idx = np.where(labels == 1)[0][0]
        onset_hour = hours[onset_idx]
        t_sepsis = onset_hour + 6
        window_start = t_sepsis - 12
        window_end = t_sepsis + 3
    else:
        window_start, window_end = -999, -999

    # -----------------------------------------------------------------------
    # PRINT ASCII TABLE
    # -----------------------------------------------------------------------
    print(f"\nTimeline for Patient {patient_id}")
    print("-" * 105)
    header = f"{'Hr':<4} | {'Label':<5} | {'SOFA':<5} | {'NEWS':<5} | {'Raw Prob':<10} | {'Smooth':<10} | {'Pred':<4} | {'Status':<15}"
    print(header)
    print("-" * 105)

    critical_hour_idx = -1
    
    for i in range(len(df_pd)):
        h = hours[i]
        lbl = labels[i]
        sofa = df_pd["SOFA_Partial_Score"].iloc[i]
        news = df_pd["NEWS_Total_Score"].iloc[i]
        p_raw = probs_raw[i]
        p_smooth = probs_smooth[i]
        pred = 1 if p_smooth >= threshold else 0
        
        # Color based on Utility Window
        in_window = (h >= window_start and h <= window_end)
        style = ""
        status = ""
        
        if lbl == 1:
            style = Fore.RED if in_window else Fore.WHITE
            status = "SEPSIS ONSET" if h == onset_hour else "POST-ONSET"
        elif in_window:
            style = Fore.YELLOW
            status = "REWARD WINDOW"
        
        # Mark critical hour (first time pred flips to 1)
        if critical_hour_idx == -1 and pred == 1:
            critical_hour_idx = i
            status += " <--- ALARM"
            style = Fore.GREEN + Style.BRIGHT

        row = f"{int(h):<4} | {int(lbl):<5} | {int(sofa):<5} | {int(news):<5} | {p_raw:10.4f} | {p_smooth:10.4f} | {pred:<4} | {status:<15}"
        print(f"{style}{row}{Style.RESET_ALL}")

    print("-" * 105)

    # -----------------------------------------------------------------------
    # SHAP Explainer for Critical Hour
    # -----------------------------------------------------------------------
    if critical_hour_idx != -1:
        print(f"\n{Fore.GREEN}--- SHAP Analysis for Critical Hour {int(hours[critical_hour_idx])} ---{Style.RESET_ALL}")
        
        X_crit = X[critical_hour_idx : critical_hour_idx + 1]
        sv = explainer.shap_values(X_crit)
        
        # SHAP returns a single array for binary XGBoost usually
        if isinstance(sv, list): sv = sv[0]
        
        # Zip features with values
        feat_imp = sorted(zip(feature_cols, sv[0]), key=lambda x: abs(x[1]), reverse=True)
        
        print(f"{'Feature':<35} | {'SHAP Value':<10} | {'Impact'}")
        print("-" * 60)
        for f_name, f_val in feat_imp[:10]:
            impact = "POSITIVE" if f_val > 0 else "NEGATIVE"
            color = Fore.RED if f_val > 0 else Fore.BLUE
            print(f"{f_name:<35} | {f_val:10.6f} | {color}{impact}{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.YELLOW}No alarm triggered for this patient.{Style.RESET_ALL}")

if __name__ == "__main__":
    # Test with patient 654 (likely sepsis based on previous scan) or pass from CLI
    target_id = 654
    if len(sys.argv) > 1:
        try:
            target_id = int(sys.argv[1])
        except:
            pass
            
    visualize_patient_behavior(target_id)
