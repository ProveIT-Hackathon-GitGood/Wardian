import polars as pl
import time
import os

def load_data(filepath: str) -> pl.DataFrame:
    """
    Loads the PhysioNet dataset efficiently using Polars.
    Expects a filepath to the complete dataset CSV.
    """
    start_time = time.time()
    
    # We can explicitly map certain columns to smaller data types to conserve memory,
    # though Polars is generally quite good at inferring and optimizing natively.
    # Patient_ID should be categorical or string to prevent float inference.
    df = pl.read_csv(filepath, dtypes={
        "Patient_ID": pl.String,
        "Unit1": pl.Float32, # Using float because it might contain nulls
        "Unit2": pl.Float32,
        "SepsisLabel": pl.Int8,
        "Gender": pl.Int8
    })
    
    elapsed = time.time() - start_time
    print(f"Data loading completed in {elapsed:.2f} seconds.")
    
    return df

def get_memory_usage(df: pl.DataFrame) -> str:
    """
    Returns the memory usage of the Polars DataFrame in Megabytes.
    """
    mem_bytes = df.estimated_size()
    return f"{mem_bytes / (1024 * 1024):.2f} MB"
