import polars as pl
import os
import sys

def seed_demo_patients():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(os.path.dirname(current_dir), "Dataset.csv")
    
    print(f"Loading data from {dataset_path}...")
    
    if not os.path.exists(dataset_path):
        print("Dataset.csv not found! Make sure you have the physionet dataset extracted.")
        return
        
    df = pl.read_csv(dataset_path, dtypes={"Patient_ID": pl.String})
    
    # Identify Sepsis Patients (Where SepsisLabel == 1 at some point)
    sepsis_patients = df.filter(pl.col("SepsisLabel") == 1).select("Patient_ID").unique().to_series().to_list()
    
    # Identify Non-Sepsis Patients (Where SepsisLabel == 0 always)
    # We find all patients, then exclude sepsis_patients
    all_patients = df.select("Patient_ID").unique().to_series().to_list()
    safe_patients = [p for p in all_patients if p not in sepsis_patients]
    
    # Select P1 (Our Sepsis Demo) that has at least 24 hours of data BEFORE they got Sepsis
    # so we can use their first 24h as a "stable" baseline, then manually trigger the crash
    print("Finding a suitable Sepsis patient with >24h of history before onset...")
    p_sepsis = None
    for p in sepsis_patients:
        p_data = df.filter(pl.col("Patient_ID") == p).sort("Hour")
        first_sepsis_hour = p_data.filter(pl.col("SepsisLabel") == 1)["Hour"].min()
        if first_sepsis_hour > 24:
            p_sepsis = p
            break
            
    # Select P2 (Our Safe Demo)
    p_safe = safe_patients[0]
    
    print(f"Selected Sepsis target: {p_sepsis} (We will extract their first 24 hours)")
    print(f"Selected Safe target: {p_safe}")
    
    # Extract
    df_sepsis_24h = df.filter((pl.col("Patient_ID") == p_sepsis) & (pl.col("Hour") <= 24))
    df_safe_24h = df.filter((pl.col("Patient_ID") == p_safe) & (pl.col("Hour") <= 24))
    
    # Save
    out_sepsis = os.path.join(os.path.dirname(current_dir), "demo_patient_sepsis.csv")
    out_safe = os.path.join(os.path.dirname(current_dir), "demo_patient_safe.csv")
    
    df_sepsis_24h.write_csv(out_sepsis)
    df_safe_24h.write_csv(out_safe)
    
    print(f"Extraction complete!")
    print(f" - Sepsis Baseline -> {out_sepsis}")
    print(f" - Safe Baseline -> {out_safe}")
    
    # For UI integration, let's also grab their actual 25th Hour data to show what actually happened.
    actual_25_sepsis = df.filter((pl.col("Patient_ID") == p_sepsis) & (pl.col("Hour") == 25)).to_dicts()
    if actual_25_sepsis:
        print("\n[HINT FOR DEMO] Make the UI send THIS payload for the Sepsis patient on Hour 25:")
        print({k: v for k, v in actual_25_sepsis[0].items() if v is not None and k not in ["SepsisLabel", "Hour", "Patient_ID", "HospAdmTime", "Unit1", "Unit2"]})

if __name__ == "__main__":
    seed_demo_patients()
