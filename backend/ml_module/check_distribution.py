import polars as pl
import os

data_path = 'z:/ProveIT/Wardian/backend/ml_module/Dataset.csv'
df = pl.read_csv(data_path, schema_overrides={'Patient_ID': pl.String})
sepsis = df.filter(pl.col('SepsisLabel') == 1)
onsets = (
    sepsis.group_by('Patient_ID')
    .agg(pl.min('Hour').alias('onset_hour'))
)

print(f"Total Sepsis Patients: {onsets.height}")
print(f"Onsets after Hour 6: {onsets.filter(pl.col('onset_hour') > 6).height}")
print(f"Onsets after Hour 12: {onsets.filter(pl.col('onset_hour') > 12).height}")
print(f"Onsets after Hour 24: {onsets.filter(pl.col('onset_hour') > 24).height}")
