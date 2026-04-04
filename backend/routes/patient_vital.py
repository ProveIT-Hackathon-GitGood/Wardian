from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.patient import PatientVitalCreateSchema, PatientVitalUpdateSchema, PatientVitalResponseSchema
from services.patient_vital import PatientVitalService

db_dependency = Annotated[Session, Depends(get_db)]

patient_vital_service = PatientVitalService()

patient_vital_router = APIRouter(prefix="/api/v1/patient-vital", tags=["patient-vital"])


@patient_vital_router.get("/patient/{patient_id}", response_model=List[PatientVitalResponseSchema])
def get_vitals_by_patient(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_vital_service.get_vitals_by_patient(db, patient_id)


@patient_vital_router.get("/patient/{patient_id}/latest", response_model=PatientVitalResponseSchema)
def get_latest_vital(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_vital_service.get_latest_vital(db, patient_id)


@patient_vital_router.get("/{vital_id}", response_model=PatientVitalResponseSchema)
def get_vital_by_id(vital_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_vital_service.get_vital_by_id(db, vital_id)


@patient_vital_router.post("/", response_model=PatientVitalResponseSchema, status_code=status.HTTP_201_CREATED)
def create_vital(request: PatientVitalCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_vital_service.create_vital(db, request)


@patient_vital_router.patch("/{vital_id}", response_model=PatientVitalResponseSchema)
def update_vital(vital_id: int, request: PatientVitalUpdateSchema, db: db_dependency,
                 user_data=Depends(get_current_user)):
    return patient_vital_service.update_vital(db, vital_id, request)


@patient_vital_router.delete("/{vital_id}", status_code=status.HTTP_200_OK)
def delete_vital(vital_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_vital_service.delete_vital(db, vital_id)
