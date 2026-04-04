import os
import json
import joblib
import polars as pl
import pandas as pd
import numpy as np
import xgboost as xgb

try:
    from .features import run_pipeline, VITALS, LABS
except ImportError:
    from features import run_pipeline, VITALS, LABS

class SepsisPredictor:
    def __init__(self, artifacts_dir=None):
        if artifacts_dir is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.artifacts_dir = os.path.join(os.path.dirname(current_dir), 'artifacts')
        else:
            self.artifacts_dir = artifacts_dir
            
        self.model = xgb.XGBClassifier()
        self.model.load_model(os.path.join(self.artifacts_dir, 'xgb_sepsis_model.json'))
        
        with open(os.path.join(self.artifacts_dir, 'feature_columns.json'), 'r') as f:
            self.feature_columns = json.load(f)
            
        with open(os.path.join(self.artifacts_dir, 'threshold_sweep.json'), 'r') as f:
            sweep_data = json.load(f)
            self.threshold = sweep_data.get('best_threshold', 0.75)
            
        # Explainer is heavy, loaded once
        self.explainer = joblib.load(os.path.join(self.artifacts_dir, 'shap_explainer.joblib'))


# Global Singleton instance
predictor = SepsisPredictor()


def predict_sepsis(patient_id: str, new_data: dict, data_dir: str = None) -> dict:
    """
    Receives new UI data, appends it to patient history, generates features,
    and returns sepsis probability + SHAP explanations.
    """
    # 1. Resolve Data Path
    if data_dir is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.dirname(current_dir)
        
    csv_path = os.path.join(data_dir, f"demo_patient_{patient_id.replace('P', '')}.csv")
    
    # 2. Load Patient Buffer
    if os.path.exists(csv_path):
        # Read everything as float (except ID) to avoid vstack schema errors
        history_df = pl.read_csv(csv_path, infer_schema_length=0) # Read all as string first
        history_df = history_df.with_columns([
            pl.col(c).cast(pl.Float64, strict=False) for c in history_df.columns if c != "Patient_ID"
        ])
    else:
        raise FileNotFoundError(f"No history found for patient {patient_id} at {csv_path}. Please run seed script first.")
        
    # Determine new hour
    last_hour = history_df["Hour"].max()
    new_hour = last_hour + 1
    
    # 3. Create New Row mapped to schema
    new_row_dict = {
        "Patient_ID": patient_id,
        "Hour": new_hour,
        "Age": history_df["Age"][0],
        "Gender": history_df["Gender"][0],
        "ICULOS": float(new_hour)
    }
    
    # Fill in Vitals/Labs from UI payload
    for v in VITALS + LABS:
        if v in new_data and new_data[v] is not None:
            new_row_dict[v] = float(new_data[v])
        else:
            new_row_dict[v] = None
            
    # Add any missing columns from original dataset (e.g., HospAdmTime) to make schema match
    for col in history_df.columns:
        if col not in new_row_dict:
            new_row_dict[col] = None

    # Convert to DataFrame
    new_row_df = pl.DataFrame([new_row_dict])
    
    # Ensure schema exactly matches
    new_row_df = new_row_df.select(history_df.columns)
    
    # Append and Slide (Combined history)
    combined_df = pl.concat([history_df, new_row_df])
    
    # 4. Run Features Pipeline
    # The pipeline calculates rolling windows, logic, trends, and TTL based on all the rows
    processed_df = run_pipeline(combined_df)
    
    # Ensure all required features are present for the model
    for col in predictor.feature_columns:
        if col not in processed_df.columns:
            processed_df = processed_df.with_columns(pl.lit(0.0).alias(col))
            
    # Extract just the very last row for prediction and only model columns
    inference_df = processed_df.tail(1).select(predictor.feature_columns)
    
    # XGBoost and SHAP require pandas
    X = inference_df.to_pandas()
    
    # 5. Predict Score
    proba = float(predictor.model.predict_proba(X)[0, 1])
    is_sepsis = bool(proba >= predictor.threshold)
    
    # 6. SHAP Explainability (Single Row)
    shap_values = predictor.explainer.shap_values(X)
    
    # Handle both shape formats of SHAP depending on XGBoost version (Binary vs Multi)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
        
    shap_vals_row = shap_values[0]
    
    # Pair feature names, actual input values, and their SHAP impacts
    feature_impacts = []
    for i, col in enumerate(predictor.feature_columns):
        val = float(X.iloc[0, i])
        impact = float(shap_vals_row[i])
        if abs(impact) > 0.001:  # Filter noise
            feature_impacts.append({
                "feature": col,
                "value": val, # Need the feature-engineered value (e.g. HR_min_24h = 110)
                "shap_impact": impact
            })
            
    # Sort by strongest absolute impact
    feature_impacts.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)
    top_drivers = feature_impacts[:8]
    
    # 7. Advance sliding window & Save 
    # Let's keep 24 rows minimum for next time
    if len(combined_df) > 24:
        combined_df = combined_df.tail(24)
        
    combined_df.write_csv(csv_path)
    
    return {
        "patient_id": patient_id,
        "hour": new_hour,
        "is_sepsis": is_sepsis,
        "sepsis_probability": round(proba, 4),
        "threshold_used": predictor.threshold,
        "top_drivers": top_drivers
    }
