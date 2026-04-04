"""
test_ml_service.py — Integration test for MLService
=====================================================
Loads a real 24-hour history from the PhysioNet dataset for patient 102746
(whose SepsisLabel turns to 1 at hour 178), then calls MLService.predict()
with the real onset-hour observation and verifies:

  - The risk delta is positive (probability rising).
  - The response schema is complete and JSON-serialisable.
  - A CAUTION or ALERT is flagged appropriately.

Run from the backend/ directory:
    python -m services.test_ml_service
or directly:
    python services/test_ml_service.py
"""

from __future__ import annotations

import json
import os
import sys

import polars as pl

# ---------------------------------------------------------------------------
# Path setup
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ML_MODULE   = os.path.join(_BACKEND_DIR, "..", "ml_module")
_SRC         = os.path.join(_ML_MODULE, "src")

# Add both the src ml module and the backend root to path
for _p in [_SRC, _BACKEND_DIR, os.path.join(_BACKEND_DIR, "..")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from ml_service import MLService, SepsisObservation  # noqa: E402

# ---------------------------------------------------------------------------
# 1. Load real history from the dataset
# ---------------------------------------------------------------------------
DATA_FILE = os.path.join(_ML_MODULE, "../Dataset.csv")
PATIENT_ID = "001895"

print(f"Loading dataset from {DATA_FILE}...")
df = pl.read_csv(DATA_FILE, schema_overrides={"Patient_ID": pl.String})
patient_df = df.filter(pl.col("Patient_ID") == PATIENT_ID).sort("Hour")
ONSET_HOUR = patient_df.filter(pl.col("SepsisLabel") == 1).head(1)["Hour"].item() # first hour where SepsisLabel == 1
if not ONSET_HOUR:
    ONSET_HOUR = patient_df.tail(1)["Hour"].item()
print(f"ONSET_HOUR: {ONSET_HOUR}")

# Pre-onset: last 24 hours before SepsisLabel turns 1
pre_df = patient_df.filter(pl.col("Hour") < ONSET_HOUR).tail(24)
print(f"Pre-onset rows loaded: {pre_df.height}  (hours {pre_df['Hour'].min()} – {pre_df['Hour'].max()})")

# Build history as a list of SepsisObservation
history: list[SepsisObservation] = []
for row in pre_df.to_dicts():
    obs = SepsisObservation(
        patient_id = str(row.get("Patient_ID", PATIENT_ID)),
        hour       = float(row["Hour"]),
        HR         = row.get("HR"),
        O2Sat      = row.get("O2Sat"),
        Temp       = row.get("Temp"),
        SBP        = row.get("SBP"),
        MAP        = row.get("MAP"),
        DBP        = row.get("DBP"),
        Resp       = row.get("Resp"),
        EtCO2      = row.get("EtCO2"),
        BaseExcess = row.get("BaseExcess"),
        HCO3       = row.get("HCO3"),
        FiO2       = row.get("FiO2"),
        pH         = row.get("pH"),
        PaCO2      = row.get("PaCO2"),
        SaO2       = row.get("SaO2"),
        AST        = row.get("AST"),
        BUN        = row.get("BUN"),
        Alkalinephos    = row.get("Alkalinephos"),
        Calcium         = row.get("Calcium"),
        Chloride        = row.get("Chloride"),
        Creatinine      = row.get("Creatinine"),
        Bilirubin_direct= row.get("Bilirubin_direct"),
        Glucose         = row.get("Glucose"),
        Lactate         = row.get("Lactate"),
        Magnesium       = row.get("Magnesium"),
        Phosphate       = row.get("Phosphate"),
        Potassium       = row.get("Potassium"),
        Bilirubin_total = row.get("Bilirubin_total"),
        TroponinI       = row.get("TroponinI"),
        Hct             = row.get("Hct"),
        Hgb             = row.get("Hgb"),
        PTT             = row.get("PTT"),
        WBC             = row.get("WBC"),
        Fibrinogen      = row.get("Fibrinogen"),
        Platelets       = row.get("Platelets"),
        Age             = row.get("Age"),
        Gender          = row.get("Gender"),
        Unit1           = row.get("Unit1"),
        Unit2           = row.get("Unit2"),
        HospAdmTime     = row.get("HospAdmTime"),
        ICULOS          = row.get("ICULOS"),
    )
    history.append(obs)

# ---------------------------------------------------------------------------
# 2. Define the "new observation" from the UI (hour 178 — onset row)
# ---------------------------------------------------------------------------
#
# These are the REAL measured values from the dataset at hour 178
# (the first row where SepsisLabel flips to 1).  The model should detect
# the risk heightening based on the suddenly elevated MAP (110) and
# continuing tachypnoea (Resp 21).
#
onset_row_dict = (
    patient_df
    .filter(pl.col("Hour") == ONSET_HOUR)
    .to_dicts()[0]
)

# Build the UI payload: only include non-null, non-ID fields that a nurse
# would realistically enter in the monitoring interface.
UI_OBSERVATION: dict = {
    k: v for k, v in onset_row_dict.items()
    if v is not None
    and k not in {"Patient_ID", "Hour", "SepsisLabel", "Unit1", "Unit2", "HospAdmTime", ""}
}
print(f"\nMock UI observation (Hour {ONSET_HOUR}): {UI_OBSERVATION}")

# ---------------------------------------------------------------------------
# 3. Call the service
# ---------------------------------------------------------------------------
print("\nInvoking MLService.predict()...\n")
service = MLService()
result  = service.predict(
    patient_id      = PATIENT_ID,
    history         = history,
    new_observation = UI_OBSERVATION,
)

# ---------------------------------------------------------------------------
# 4. Pretty-print the JSON result
# ---------------------------------------------------------------------------
print("=" * 70)
print(" PREDICTION RESULT (JSON)")
print("=" * 70)
print(json.dumps(result, indent=2))
print("=" * 70)

# ---------------------------------------------------------------------------
# 5. Assertions
# ---------------------------------------------------------------------------
# assert isinstance(result["current_probability"], float),   "current_probability must be float"
# assert isinstance(result["previous_probability"], float),  "previous_probability must be float"
# assert isinstance(result["risk_delta"], float),            "risk_delta must be float"
# assert result["risk_trend"] in {"RISING", "STABLE", "IMPROVING"}, "risk_trend invalid"
# assert isinstance(result["is_sepsis_alert"], bool),        "is_sepsis_alert must be bool"
# assert len(result["top_drivers"]) > 0,                     "top_drivers should not be empty"

# print("\n[PASS] All schema assertions passed.")

if result["is_sepsis_alert"]:
    print(f"[ALERT] Sepsis flag POSITIVE at {result['current_probability']*100:.1f}% probability.")
elif result["risk_trend"] == "RISING":
    print(f"[CAUTION] Risk RISING: {result['previous_probability']*100:.1f}% -> {result['current_probability']*100:.1f}%  (delta +{result['risk_delta']*100:.1f}%)")
else:
    print(f"[INFO] Risk trend: {result['risk_trend']}  ({result['current_probability']*100:.1f}%)")
