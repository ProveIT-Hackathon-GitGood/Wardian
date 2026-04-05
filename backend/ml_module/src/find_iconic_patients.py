"""
find_iconic_patients.py — Search for 5 "iconic" sepsis predictions.

Strategy:
  For each sepsis-positive patient with onset > 24h:
    - Scan hour-by-hour from hour 6 onward
    - Build the carry-forward history up to hour t, predict at t+1
    - Find the FIRST hour where probability crosses 0.35 (detectable alert)
    - Require a risk_delta >= 0.1 at that crossing point
    
  From all qualifying candidates, select:
    - Top 2 by maximum risk_delta (most dramatic spike)
    - Top 3 by maximum lead_time (earliest warning)
"""
import os
import sys
import json
import polars as pl
from typing import List, Optional

_SRC_DIR = os.path.dirname(os.path.abspath(__file__))
_ML_MODULE = os.path.dirname(_SRC_DIR)
_BACKEND_ROOT = os.path.dirname(_ML_MODULE)

for _p in [_SRC_DIR, _BACKEND_ROOT]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from ml_service import MLService
from schemas.patient import PatientVitalResponseSchema


def _row_to_schema(row: dict, idx: int) -> PatientVitalResponseSchema:
    """Convert a raw CSV row dict (with capital-H Hour etc.) to the Pydantic schema."""
    return PatientVitalResponseSchema(
        id=idx,
        patient_id=1,
        hour=float(row["Hour"]),
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


def _ui_payload(row: dict) -> dict:
    """Strip metadata keys — only clinical fields for the UI input."""
    EXCLUDE = {"Patient_ID", "Hour", "SepsisLabel", "Unit1", "Unit2",
               "HospAdmTime", "Age", "Gender", ""}
    return {k: v for k, v in row.items() if v is not None and k not in EXCLUDE}


def find_iconic_patients():
    DATA_FILE = os.path.join(_ML_MODULE, "Dataset.csv")
    print(f"Loading dataset from {DATA_FILE}...")
    df = pl.read_csv(DATA_FILE, schema_overrides={"Patient_ID": pl.String})

    # ── Sepsis patients with onset AFTER hour 25 (enough pre-onset window) ──
    onset_df = (
        df.filter(pl.col("SepsisLabel") == 1)
          .group_by("Patient_ID")
          .agg(pl.col("Hour").min().alias("onset_hour"))
          .filter(pl.col("onset_hour") > 25)
          .sort("onset_hour", descending=True)   # process late-onset first (more room)
    )
    pids = onset_df["Patient_ID"].to_list()
    onset_map = dict(zip(onset_df["Patient_ID"].to_list(), onset_df["onset_hour"].to_list()))

    print(f"Sepsis patients with onset > 25h: {len(pids)}")

    service = MLService()
    candidates = []

    # ── Detection threshold — lower than the clinical alert threshold ────────
    # We just want "model is clearly rising" — not necessarily a full alert
    DETECT_PROB   = 0.35   # probability must be at least this at detection time
    DETECT_DELTA  = 0.10   # delta must be at least this (dramatic jump)
    SEARCH_LIMIT  = 400    # cap: how many patients to scan

    scanned = 0
    for pid in pids:
        if scanned >= SEARCH_LIMIT:
            print("Search limit reached.")
            break

        onset_hour = onset_map[pid]
        patient_df = df.filter(pl.col("Patient_ID") == pid).sort("Hour")

        age    = patient_df.head(1)["Age"].item()
        gender = patient_df.head(1)["Gender"].item()

        all_rows = patient_df.to_dicts()
        hours    = [r["Hour"] for r in all_rows]

        # Hours available before onset
        pre_onset_hours = [h for h in hours if h < onset_hour]
        if len(pre_onset_hours) < 7:     # need at least 6 history rows + 1 new obs
            continue

        scanned += 1
        if scanned % 50 == 1:
            print(f"  [{scanned}/{SEARCH_LIMIT}] Scanning patient {pid} (onset h{onset_hour})...")

        # ── Iterate: history = [0..t), new_obs = row at t ───────────────────
        # Start once we have at least 6 history rows
        best: Optional[dict] = None

        for t_idx, t in enumerate(pre_onset_hours):
            if t_idx < 6:          # need at least 6 rows in history
                continue

            history_rows  = [all_rows[i] for i, h in enumerate(hours) if h < t]
            new_obs_row   = next(r for r in all_rows if r["Hour"] == t)

            history_schemas = [_row_to_schema(r, i) for i, r in enumerate(history_rows)]
            ui_payload      = _ui_payload(new_obs_row)

            try:
                res = service.predict(
                    patient_id=pid,
                    history=history_schemas,
                    new_observation=ui_payload,
                    age=age,
                    gender=gender,
                )
            except Exception:
                continue

            prob  = res["current_probability"]
            delta = res["risk_delta"]

            # Is this an "iconic moment"?
            if prob >= DETECT_PROB and delta >= DETECT_DELTA:
                lead_time = onset_hour - t
                candidate = {
                    "patient_id":           pid,
                    "hour":                 t,
                    "clinical_onset":       onset_hour,
                    "lead_time":            lead_time,
                    "risk_delta":           round(delta, 4),
                    "current_probability":  round(prob,  4),
                    "previous_probability": round(res["previous_probability"], 4),
                    "top_drivers":          res["top_drivers"],
                }
                # Keep the single best moment per patient (highest delta)
                if best is None or delta > best["risk_delta"]:
                    best = candidate
                # Once we've found the first crossing, break to get earliest detection
                if best is not None:
                    break   # keep the FIRST iconic crossing (maximum lead time)

        if best:
            candidates.append(best)
            print(f"    ✓ Candidate: Δ={best['risk_delta']*100:.1f}% prob={best['current_probability']*100:.1f}% lead={best['lead_time']}h")
            if len(candidates) >= 30:
                print("Enough candidates found, stopping.")
                break

    # ── Ranking ──────────────────────────────────────────────────────────────
    if not candidates:
        print("\nNo candidates found. Try lowering DETECT_PROB or DETECT_DELTA.")
        return

    print(f"\nTotal qualifying candidates: {len(candidates)}")

    # Top 2 by highest risk delta
    by_delta = sorted(candidates, key=lambda x: x["risk_delta"], reverse=True)
    top_delta = by_delta[:2]

    # Top 3 by longest lead time (excluding already-selected patients)
    selected_pids = {p["patient_id"] for p in top_delta}
    by_lead  = sorted(
        [c for c in candidates if c["patient_id"] not in selected_pids],
        key=lambda x: x["lead_time"],
        reverse=True,
    )
    top_lead = by_lead[:3]

    final_5 = top_delta + top_lead

    # ── Report ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print(" TOP 5 ICONIC SEPSIS PREDICTIONS")
    print("=" * 80)

    for i, p in enumerate(final_5):
        category = "HIGH DELTA" if i < 2 else "EARLY WARNING"
        print(f"\n[{i+1}] Patient {p['patient_id']}  ({category})")
        print(f"    Detection Hour : {p['hour']}")
        print(f"    Clinical Onset : {p['clinical_onset']}")
        print(f"    Lead Time      : {p['lead_time']} hours ahead of clinical flag")
        print(f"    Risk Jump      : {p['previous_probability']*100:.1f}% → {p['current_probability']*100:.1f}%  (Δ +{p['risk_delta']*100:.1f}%)")
        print(f"    Top Drivers    : {', '.join(d['feature'] for d in p['top_drivers'])}")

    out_path = os.path.join(_ML_MODULE, "iconic_patients.json")
    with open(out_path, "w") as f:
        json.dump(final_5, f, indent=2)
    print(f"\nSaved → {out_path}")


if __name__ == "__main__":
    find_iconic_patients()
