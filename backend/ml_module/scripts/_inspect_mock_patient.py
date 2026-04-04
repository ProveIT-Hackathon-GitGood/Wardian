import polars as pl
import json
import os

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_FILE = os.path.join(BASE_DIR, "Dataset.csv")

df = pl.read_csv(DATA_FILE, schema_overrides={"Patient_ID": pl.String})
p = "102746"
pdata = df.filter(pl.col("Patient_ID") == p).sort("Hour")
onset_hour = pdata.filter(pl.col("SepsisLabel") == 1)["Hour"].min()
print(f"Onset hour: {onset_hour}")

pre24 = pdata.filter(pl.col("Hour") < onset_hour).tail(24)
print(f"Pre-onset rows: {pre24.height}, Hours: {pre24['Hour'].to_list()}")

# Print the 3 rows around onset
window = pdata.filter(
    (pl.col("Hour") >= onset_hour - 3) & (pl.col("Hour") <= onset_hour + 1)
)
print("\n== Around onset ==")
exclude = {"Patient_ID", "Unit1", "Unit2", "HospAdmTime"}
for row in window.to_dicts():
    filtered = {k: v for k, v in row.items() if v is not None and k not in exclude}
    print(json.dumps(filtered, indent=2))
