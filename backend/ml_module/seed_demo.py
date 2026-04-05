"""
seed_demo.py — Automated Database Seeding for Iconic Demo Patients
===================================================================
Reads iconic_patients.json + Dataset.csv, inserts demo infrastructure
(department → ward → beds) and patient records with vitals into the
database via SQLAlchemy.  Then runs the ML model to compute an initial
sepsis_risk_score for each patient.

Usage:
    cd backend
    python -m ml_module.seed_demo
"""

from __future__ import annotations

import json
import math
import os
import sys
from datetime import datetime

import polars as pl

# ── Path wiring ──────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.dirname(_SCRIPT_DIR)

# Ensure the backend root is importable
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)
if os.path.join(_SCRIPT_DIR, "src") not in sys.path:
    sys.path.insert(0, os.path.join(_SCRIPT_DIR, "src"))

from database import SessionLocal, engine, Base          # noqa: E402
from models.patient import Patient, PatientVital          # noqa: E402
from models.department import Department                  # noqa: E402
from models.ward import Ward                              # noqa: E402
from models.bed import Bed                                # noqa: E402
from models.hospital import Hospital                      # noqa: E402
from models.medical_staff import MedicalStaff             # noqa: E402
from models.alert import Alert                            # noqa: E402
from models.employee_code import EmployeeCode             # noqa: E402

# ── Config ───────────────────────────────────────────────────────────
ICONIC_JSON  = os.path.join(_SCRIPT_DIR, "iconic_patients.json")
DATASET_CSV  = os.path.join(_SCRIPT_DIR, "Dataset.csv")
BASE_ID      = 9000   # starting ID for demo entities (high to avoid collisions)

# Demo infrastructure names
DEMO_HOSPITAL_NAME   = "Metropolitan General Hospital"
DEMO_DEPARTMENT_NAME  = "Critical Care Unit"
DEMO_WARD_NUMBER      = "Ward 5 Alpha"

# Mapping of iconic patient IDs to humane names
ICONIC_PATIENT_NAMES = {
    "110411": "Robert A. Harrison",
    "105045": "Maria S. Ionescu",
    "111353": "Constantin G. Popescu",
    "018469": "Elena D. Vasilescu",
    "111512": "Andrei C. Marinescu",
}


def _safe_float(val) -> float | None:
    """Convert a value to float, returning None for NaN/None."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None


def seed():
    """Main seeding entry-point."""
    # ── Load iconic patient metadata ────────────────────────────────
    with open(ICONIC_JSON, "r") as f:
        iconic = json.load(f)

    patient_targets = {p["patient_id"]: p["hour"] for p in iconic}
    patient_ids = list(patient_targets.keys())

    # ── Load dataset ────────────────────────────────────────────────
    print(f"Loading dataset from {DATASET_CSV} ...")
    df = pl.read_csv(DATASET_CSV, schema_overrides={"Patient_ID": pl.String})
    df_patients = df.filter(pl.col("Patient_ID").is_in(patient_ids))
    print(f"  Found {len(df_patients)} rows for {len(patient_ids)} iconic patients.")

    # ── Database session ────────────────────────────────────────────
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. Demo infrastructure (ON CONFLICT → skip) ────────────
        hospital = db.query(Hospital).filter(Hospital.name == DEMO_HOSPITAL_NAME).first()
        if not hospital:
            hospital = Hospital(name=DEMO_HOSPITAL_NAME)
            db.add(hospital)
            db.flush()
            print(f"  Created hospital: {DEMO_HOSPITAL_NAME} (id={hospital.id})")
        else:
            print(f"  Hospital already exists: {DEMO_HOSPITAL_NAME} (id={hospital.id})")

        department = (
            db.query(Department)
            .filter(Department.name == DEMO_DEPARTMENT_NAME, Department.hospital_id == hospital.id)
            .first()
        )
        if not department:
            department = Department(name=DEMO_DEPARTMENT_NAME, hospital_id=hospital.id)
            db.add(department)
            db.flush()
            print(f"  Created department: {DEMO_DEPARTMENT_NAME} (id={department.id})")
        else:
            print(f"  Department already exists: {DEMO_DEPARTMENT_NAME} (id={department.id})")

        ward = (
            db.query(Ward)
            .filter(Ward.ward_number == DEMO_WARD_NUMBER, Ward.department_id == department.id)
            .first()
        )
        if not ward:
            ward = Ward(ward_number=DEMO_WARD_NUMBER, department_id=department.id)
            db.add(ward)
            db.flush()
            print(f"  Created ward: {DEMO_WARD_NUMBER} (id={ward.id})")
        else:
            print(f"  Ward already exists: {DEMO_WARD_NUMBER} (id={ward.id})")

        # Create one bed per iconic patient
        bed_ids: list[int] = []
        for i in range(len(patient_ids)):
            bed_number = f"Bed-5A-{i + 1:02d}"
            bed = (
                db.query(Bed)
                .filter(Bed.bed_number == bed_number, Bed.ward_id == ward.id)
                .first()
            )
            if not bed:
                bed = Bed(ward_id=ward.id, bed_number=bed_number, is_occupied=True)
                db.add(bed)
                db.flush()
                print(f"  Created bed: {bed_number} (id={bed.id})")
            else:
                print(f"  Bed already exists: {bed_number} (id={bed.id})")
            bed_ids.append(bed.id)

        db.commit()

        # ── 2. Insert patients + vitals ─────────────────────────────
        for idx, p_id in enumerate(patient_ids):
            target_hour = patient_targets[p_id]

            # Check if patient already seeded (by cnp)
            existing = db.query(Patient).filter(Patient.cnp == p_id).first()
            if existing:
                print(f"  Patient {p_id} already exists (id={existing.id}), skipping.")
                continue

            # Extract rows before target hour
            patient_data = (
                df_patients
                .filter((pl.col("Patient_ID") == p_id) & (pl.col("ICULOS") < target_hour))
                .sort("ICULOS")
            )

            if len(patient_data) == 0:
                print(f"  WARNING: No data found for patient {p_id} before hour {target_hour}")
                continue

            first_row = patient_data.row(0, named=True)
            age_val = _safe_float(first_row.get("Age"))
            gender_raw = first_row.get("Gender")
            gender_val = _safe_float(gender_raw)
            gender_str = "M" if gender_val == 1 else "F" if gender_val == 0 else "U"

            # Create patient
            patient_name = ICONIC_PATIENT_NAMES.get(p_id, f"Patient {p_id}")
            patient = Patient(
                bed_id=bed_ids[idx],
                name=patient_name,
                age=int(age_val) if age_val is not None else None,
                gender=gender_str,
                cnp=p_id,
                phone_number=f"0744-123-{100 + idx}",
                emergency_contact_name="Family Member",
                emergency_contact="0722-987-000",
                attending_physician="Dr. Alexander Vance",
                blood_type="O+",
                allergies="None",
                admission_date=datetime.utcnow(),
                is_active=True,
                sepsis_risk_score=None,  # will be set after ML prediction
            )
            db.add(patient)
            db.flush()
            print(f"  Created patient {p_id} -> DB id={patient.id}")

            # Vital signs columns (must match PatientVital model)
            vital_cols = [
                "HR", "O2Sat", "Temp", "SBP", "MAP", "DBP", "Resp", "EtCO2",
                "BaseExcess", "HCO3", "FiO2", "pH", "PaCO2", "SaO2", "AST", "BUN",
                "Alkalinephos", "Calcium", "Chloride", "Creatinine", "Bilirubin_direct",
                "Glucose", "Lactate", "Magnesium", "Phosphate", "Potassium",
                "Bilirubin_total", "TroponinI", "Hct", "Hgb", "PTT", "WBC",
                "Fibrinogen", "Platelets", "Unit1", "Unit2", "HospAdmTime", "ICULOS",
            ]

            for row_idx in range(len(patient_data)):
                row = patient_data.row(row_idx, named=True)
                vital = PatientVital(patient_id=patient.id)
                vital.hour = _safe_float(row.get("Hour"))

                for col in vital_cols:
                    setattr(vital, col, _safe_float(row.get(col)))

                db.add(vital)

            db.commit()
            print(f"    Inserted {len(patient_data)} vital rows for patient {p_id}")

        # ── 3. Compute initial risk scores via ML ───────────────────
        # Patch any existing patients that have admission_date=None (backfill)
        null_date_patients = db.query(Patient).filter(Patient.admission_date == None).all()  # noqa: E711
        if null_date_patients:
            now = datetime.utcnow()
            for p in null_date_patients:
                p.admission_date = now
            db.commit()
            print(f"  Patched {len(null_date_patients)} patients with missing admission_date.")

        print("\nComputing initial sepsis risk scores ...")
        try:
            from ml_module.src.ml_service import MLService
            from schemas.patient import PatientVitalResponseSchema

            ml = MLService()

            for p_id in patient_ids:
                patient = db.query(Patient).filter(Patient.cnp == p_id).first()
                if not patient:
                    continue

                vitals_db = (
                    db.query(PatientVital)
                    .filter(PatientVital.patient_id == patient.id)
                    .order_by(PatientVital.hour.asc())
                    .all()
                )

                if not vitals_db:
                    print(f"  {p_id}: no vitals in DB, skipping ML.")
                    continue

                vitals_schemas = [
                    PatientVitalResponseSchema.model_validate(v) for v in vitals_db
                ]

                age = float(patient.age) if patient.age else None
                gender_map = {"M": 1.0, "F": 0.0}
                gender = gender_map.get(patient.gender, None)

                prob = ml.predict_baseline(
                    patient_id=str(patient.id),
                    vitals_history=vitals_schemas,
                    age=age,
                    gender=gender,
                )

                score = round(prob * 100, 1)
                patient.sepsis_risk_score = score
                patient.ai_insight = f"Baseline risk score computed from {len(vitals_db)} hours of ICU data."
                db.commit()
                print(f"  Patient {p_id} (db id={patient.id}): sepsis_risk_score = {score}%")

        except Exception as e:
            print(f"\n  WARNING: ML scoring failed ({e}). Patients seeded without risk scores.")
            print("  You can re-run this script after fixing ML artifacts to update scores.")

        # ── 4. Seed Employee Codes ──────────────────────────────────
        print("\nSeeding employee codes ...")
        DEMO_CODES = ["DOC-001", "DOC-002", "NUR-001", "NUR-002", "ADMIN-99"]
        for code_str in DEMO_CODES:
            existing_code = db.query(EmployeeCode).filter(EmployeeCode.code == code_str).first()
            if not existing_code:
                new_code = EmployeeCode(code=code_str)
                db.add(new_code)
                print(f"  Generated employee code: {code_str}")
            else:
                print(f"  Employee code already exists: {code_str}")
        db.commit()

        print("\n[SUCCESS] Seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
