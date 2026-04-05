"""
Diagnostic: Try one known patient, one iteration of the search loop,
and print exactly what happens + any exceptions.
"""
import os, sys, traceback
import polars as pl

_SRC_DIR = os.path.dirname(os.path.abspath(__file__))
_ML_MODULE = os.path.dirname(_SRC_DIR)
_BACKEND_ROOT = os.path.dirname(_ML_MODULE)
for _p in [_SRC_DIR, _BACKEND_ROOT]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from ml_service import MLService
from schemas.patient import PatientVitalResponseSchema

DATA_FILE = os.path.join(_ML_MODULE, "Dataset.csv")
df = pl.read_csv(DATA_FILE, schema_overrides={"Patient_ID": pl.String})

# Pick a sepsis patient with a late onset
sepsis_pids = (
    df.group_by("Patient_ID")
    .agg(pl.col("SepsisLabel").max().alias("hs"), pl.col("Hour").min().alias("min_h"))
    .filter((pl.col("hs") == 1) & (pl.col("min_h") < 30))
    .sort("min_h", descending=True)["Patient_ID"]
    .to_list()
)

pid = sepsis_pids[0]
patient_df = df.filter(pl.col("Patient_ID") == pid).sort("Hour")
onset_hour = patient_df.filter(pl.col("SepsisLabel") == 1).head(1)["Hour"].item()
print(f"Patient: {pid}, Onset Hour: {onset_hour}")

age = patient_df.head(1)["Age"].item()
gender = patient_df.head(1)["Gender"].item()

# Try at t = 12
t = 12
history_rows = patient_df.filter(pl.col("Hour") < t).to_dicts()
print(f"History rows: {len(history_rows)}")
print(f"Keys in first row: {list(history_rows[0].keys())[:10]}")

# Show what happens when we feed this into the schema
try:
    row = history_rows[0]
    print(f"Hour value from CSV: {row.get('Hour')}")  # Should be capital H
    schema = PatientVitalResponseSchema(
        id=0,
        patient_id=1,
        hour=float(row["Hour"]),   # <-- explicit lowercase mapping
        HR=row.get("HR"),
        O2Sat=row.get("O2Sat"),
        Temp=row.get("Temp"),
        SBP=row.get("SBP"),
        MAP=row.get("MAP"),
        DBP=row.get("DBP"),
        Resp=row.get("Resp"),
        EtCO2=row.get("EtCO2"),
        BaseExcess=row.get("BaseExcess"),
        HCO3=row.get("HCO3"),
        FiO2=row.get("FiO2"),
        pH=row.get("pH"),
        PaCO2=row.get("PaCO2"),
        SaO2=row.get("SaO2"),
        AST=row.get("AST"),
        BUN=row.get("BUN"),
        Alkalinephos=row.get("Alkalinephos"),
        Calcium=row.get("Calcium"),
        Chloride=row.get("Chloride"),
        Creatinine=row.get("Creatinine"),
        Bilirubin_direct=row.get("Bilirubin_direct"),
        Glucose=row.get("Glucose"),
        Lactate=row.get("Lactate"),
        Magnesium=row.get("Magnesium"),
        Phosphate=row.get("Phosphate"),
        Potassium=row.get("Potassium"),
        Bilirubin_total=row.get("Bilirubin_total"),
        TroponinI=row.get("TroponinI"),
        Hct=row.get("Hct"),
        Hgb=row.get("Hgb"),
        PTT=row.get("PTT"),
        WBC=row.get("WBC"),
        Fibrinogen=row.get("Fibrinogen"),
        Platelets=row.get("Platelets"),
        Unit1=row.get("Unit1"),
        Unit2=row.get("Unit2"),
        HospAdmTime=row.get("HospAdmTime"),
        ICULOS=row.get("ICULOS"),
    )
    print(f"Schema created OK: hour={schema.hour}, HR={schema.HR}")
except Exception:
    traceback.print_exc()

# Now try a full predict call
try:
    history_schemas = []
    for i, row in enumerate(history_rows):
        obs = PatientVitalResponseSchema(
            id=i,
            patient_id=1,
            hour=float(row["Hour"]),
            HR=row.get("HR"), O2Sat=row.get("O2Sat"), Temp=row.get("Temp"),
            SBP=row.get("SBP"), MAP=row.get("MAP"), DBP=row.get("DBP"),
            Resp=row.get("Resp"), EtCO2=row.get("EtCO2"),
            BaseExcess=row.get("BaseExcess"), HCO3=row.get("HCO3"),
            FiO2=row.get("FiO2"), pH=row.get("pH"), PaCO2=row.get("PaCO2"),
            SaO2=row.get("SaO2"), AST=row.get("AST"), BUN=row.get("BUN"),
            Alkalinephos=row.get("Alkalinephos"), Calcium=row.get("Calcium"),
            Chloride=row.get("Chloride"), Creatinine=row.get("Creatinine"),
            Bilirubin_direct=row.get("Bilirubin_direct"), Glucose=row.get("Glucose"),
            Lactate=row.get("Lactate"), Magnesium=row.get("Magnesium"),
            Phosphate=row.get("Phosphate"), Potassium=row.get("Potassium"),
            Bilirubin_total=row.get("Bilirubin_total"), TroponinI=row.get("TroponinI"),
            Hct=row.get("Hct"), Hgb=row.get("Hgb"), PTT=row.get("PTT"),
            WBC=row.get("WBC"), Fibrinogen=row.get("Fibrinogen"),
            Platelets=row.get("Platelets"), Unit1=row.get("Unit1"),
            Unit2=row.get("Unit2"), HospAdmTime=row.get("HospAdmTime"),
            ICULOS=row.get("ICULOS"),
        )
        history_schemas.append(obs)

    new_obs_row = patient_df.filter(pl.col("Hour") == t).to_dicts()[0]
    ui_payload = {
        k: v for k, v in new_obs_row.items()
        if v is not None
        and k not in ["Patient_ID", "Hour", "SepsisLabel", "Unit1", "Unit2", "HospAdmTime", "Age", "Gender"]
    }

    service = MLService()
    res = service.predict(
        patient_id=pid,
        history=history_schemas,
        new_observation=ui_payload,
        age=age,
        gender=gender
    )
    print(f"Predict result: prob={res['current_probability']:.3f}, delta={res['risk_delta']:.3f}, alert={res['is_sepsis_alert']}")
except Exception:
    traceback.print_exc()
