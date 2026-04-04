import os
import sys

# Ensure src module is discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.data_loader import load_data, get_memory_usage
from src.features import run_pipeline

def main():
    filepath = "Dataset.csv"
    filepath = os.path.join(os.path.dirname(__file__), filepath)
    
    import polars as pl
    pl.Config.set_ascii_tables(True)
    
    print("Loading data...")
    df = load_data(filepath)
    
    print("Executing Sprint 2 Feature Engineering...")
    # Slicing a subset for rapid validation (e.g., first 10,000 rows representing top patients)
    df_sample = df.head(10000)
    
    df_features = run_pipeline(df_sample)
    
    print(f"\n--- Output Memory & Dimensions ---")
    print(f"Sample Rows Sliced: {df_features.height:,} | New Columns Count: {df_features.width}")
    
    print("\n--- Spot Check: Rolling Vitals ---")
    print(df_features.select(["Patient_ID", "Hour", "HR", "HR_mean_4h", "HR_max_4h"]).head(10))
    
    print("\n--- Spot Check: Lab TTLs (BaseExcess) ---")
    print(df_features.select(["Patient_ID", "Hour", "BaseExcess", "BaseExcess_is_missing", "BaseExcess_hours_since_last"]).head(10))

if __name__ == "__main__":
    main()
