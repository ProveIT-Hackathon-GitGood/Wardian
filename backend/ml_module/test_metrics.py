import os
import sys
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.metrics import compute_physionet_utility

def run_tests():
    print("Testing Sprint 3 Metrics Calculation...")
    
    # CASE 1: Perfect Classifier on Sepsis Patient
    # SepsisLabel becomes 1 at hour 10 (which means t_sepsis = 16)
    # The optimal prediction is exactly at hour 10 (t_sepsis - 6).
    df_perfect = pd.DataFrame({
        'Patient_ID': [1] * 20,
        'Hour': np.arange(20),
        'SepsisLabel': [0]*10 + [1]*10,
        'Prediction': [0]*4 + [1]*15 + [0]*1 # Prefect predictions in the reward window
    })
    
    u_perfect = compute_physionet_utility(df_perfect)
    print(f"CASE 1 | Perfect Prediction Utility: {u_perfect:.3f}")
    
    # CASE 2: Late Prediction on Sepsis Patient
    # Predicts at hour 18, which is t_sepsis + 2 (late)
    df_late = pd.DataFrame({
        'Patient_ID': [2] * 20,
        'Hour': np.arange(20),
        'SepsisLabel': [0]*10 + [1]*10,
        'Prediction': [0]*18 + [1]*2  
    })
    
    u_late = compute_physionet_utility(df_late)
    print(f"CASE 2 | Late Prediction Utility: {u_late:.3f}")
    
    # CASE 3: False Alarms on Healthy Patient
    df_false_alarm = pd.DataFrame({
        'Patient_ID': [3] * 20,
        'Hour': np.arange(20),
        'SepsisLabel': [0]*20,
        'Prediction': [1]*20  # Always alarms
    })
    
    # A perfect classifier for healthy patient max_u is 0, so ratio will be 0 typically,
    # But let's combine it with the perfect patient to see the drag on normalized utility
    df_combined = pd.concat([df_perfect, df_false_alarm])
    u_combined = compute_physionet_utility(df_combined)
    
    print(f"CASE 3 | Combined with False Alarms Utility: {u_combined:.3f}")
    
if __name__ == "__main__":
    run_tests()
