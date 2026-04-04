import os
import sys

# Ensure src module is discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.data_loader import load_data, get_memory_usage

def main():
    filepath = "Dataset.csv"
    filepath = os.path.join(os.path.dirname(__file__), filepath)
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found in current directory.")
        return
    
    print("Initializing Sprint 1 Data Pipeline Exploration...\n")
    df = load_data(filepath)
    
    print("\n--- Memory & Dimensions ---")
    print(f"Rows: {df.height:,} | Columns: {df.width}")
    print(f"Estimated Memory Usage: {get_memory_usage(df)}")
    
    print("\n--- Schema Review ---")
    dtypes = {k: str(v) for k, v in zip(df.columns, df.dtypes)}
    print(dtypes)
    
    print("\n--- SepsisLabel Check ---")
    sepsis_counts = df.group_by("SepsisLabel").len().to_dict(as_series=False)
    print(f"Distribution: {sepsis_counts}")
    
    print("\n--- Unit Formatting Checks ---")
    # Quick visual on the unique categorical groupings
    unit1_nulls = df["Unit1"].is_null().sum()
    unit2_nulls = df["Unit2"].is_null().sum()
    print(f"Unit1 Missingness: {unit1_nulls}/{df.height} ({unit1_nulls/df.height*100:.1f}%)")
    print(f"Unit2 Missingness: {unit2_nulls}/{df.height} ({unit2_nulls/df.height*100:.1f}%)")
    
if __name__ == "__main__":
    main()
