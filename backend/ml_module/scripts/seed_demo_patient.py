import polars as pl
import numpy as np
import os

VITALS = [
    'HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2'
]

LABS = [
    'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN', 
    'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct', 
    'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium', 
    'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC', 
    'Fibrinogen', 'Platelets'
]

def seed_demo_patient(output_path):
    print("Generating 24-hour stable baseline for Demo Patient 192...")
    np.random.seed(42)  # For reproducibility
    
    rows = []
    
    for i in range(1, 25):
        row = {
            "Patient_ID": "P192",
            "Hour": i,
            "Age": 65.0,
            "Gender": 1.0,  # 1 = Male
            "ICULOS": float(i)
        }
        
        # Stable Vitals
        row["HR"] = np.random.normal(70, 2)
        row["O2Sat"] = np.random.normal(98, 1)
        row["Temp"] = np.random.normal(36.8, 0.2)
        row["SBP"] = np.random.normal(118, 4)
        row["DBP"] = np.random.normal(75, 3)
        row["MAP"] = (row["SBP"] + 2 * row["DBP"]) / 3
        row["Resp"] = np.random.normal(14, 1)
        row["EtCO2"] = None
        
        # Initialize all labs to None by default
        for lab in LABS:
            row[lab] = None
        
        # Add a baseline lab drawn at Hour 1 so there's at least one data point
        if i == 1:
            row["WBC"] = 7.5
            row["Glucose"] = 90.0
            row["BUN"] = 15.0
            row["Lactate"] = 1.0 # Normal lactate
        
        rows.append(row)
        
    df = pl.DataFrame(rows)
    
    # Save to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.write_csv(output_path)
    print(f"Successfully saved to {output_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(os.path.dirname(current_dir), "demo_patient_192.csv")
    seed_demo_patient(output_csv)
