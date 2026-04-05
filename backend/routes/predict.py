from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from repositories.patient import PatientRepository
from repositories.patient_vital import PatientVitalRepository
from schemas.patient import (
    RiskUpdateRequest,
    PatientVitalCreateSchema,
    PatientVitalResponseSchema,
)
from ml_module.src.ml_service import MLService

db_dependency = Annotated[Session, Depends(get_db)]

patient_repo = PatientRepository()
vital_repo = PatientVitalRepository()
ml_service = MLService()

predict_router = APIRouter(prefix="/api/v1/predict", tags=["predict"])


@predict_router.post("/{patient_id}/risk-update", status_code=200)
async def risk_update(
    patient_id: int,
    body: RiskUpdateRequest,
    db: db_dependency,
    user_data=Depends(get_current_user),
):
    """
    Receives a batch of vital sign values from the frontend Data Input,
    persists them to patient_vitals, runs the ML sepsis prediction pipeline,
    and returns a structured risk assessment.

    Request body example:
        { "vitals": { "HR": 88.0, "Temp": 37.5, "SBP": 120.0 } }
    """
    # ── 1. Validate patient exists ──────────────────────────────────────
    patient = patient_repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # ── 2. Figure out the next hour number ──────────────────────────────
    latest_vital = vital_repo.get_latest_vital(db, patient_id)
    next_hour = (latest_vital.hour + 1.0) if latest_vital and latest_vital.hour is not None else 1.0

    # ── 3. Build and persist the new vital record ───────────────────────
    vital_data = {
        "patient_id": patient_id,
        "timestamp": datetime.utcnow(),
        "hour": next_hour,
        "ICULOS": next_hour,
    }
    # Map only recognised clinical fields from the payload
    valid_fields = set(PatientVitalCreateSchema.model_fields.keys())
    for key, value in body.vitals.items():
        if key in valid_fields and value is not None:
            vital_data[key] = value

    new_vital_schema = PatientVitalCreateSchema(**vital_data)
    vital_repo.create_vital(db, new_vital_schema)

    # ── 4. Fetch last 24 h of vitals (includes the just-inserted row) ──
    recent_vitals_db = vital_repo.get_recent_vitals(db, patient_id, hours=24)
    if not recent_vitals_db:
        raise HTTPException(
            status_code=400,
            detail="No vital history found for this patient in the last 24 hours.",
        )

    # Convert ORM objects → Pydantic response schemas (what MLService expects)
    history: list[PatientVitalResponseSchema] = [
        PatientVitalResponseSchema.model_validate(v) for v in recent_vitals_db
    ]

    # ── 5. Patient demographics for ML context ──────────────────────────
    age = float(patient.age) if patient.age else None
    gender_map = {"M": 1.0, "F": 0.0}
    gender = gender_map.get(patient.gender, None)

    # ── 6. Call ML Service ──────────────────────────────────────────────
    try:
        result = ml_service.predict(
            patient_id=str(patient_id),
            history=history,
            new_observation=body.vitals,
            age=age,
            gender=gender,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"ML model not available: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    return JSONResponse(content=result)
