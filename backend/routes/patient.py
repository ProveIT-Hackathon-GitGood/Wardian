from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.patient import PatientCreateSchema, PatientUpdateSchema, PatientResponseSchema
from services.patient import PatientService

db_dependency = Annotated[Session, Depends(get_db)]

patient_service = PatientService()

patient_router = APIRouter(prefix="/api/v1/patient", tags=["patient"])


@patient_router.get("/", response_model=List[PatientResponseSchema])
def get_patients(db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.get_patients(db)


@patient_router.get("/{patient_id}", response_model=PatientResponseSchema)
def get_patient(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.get_patient(db, patient_id)

@patient_router.post("/", response_model=PatientResponseSchema, status_code=status.HTTP_201_CREATED)
def create_patient(request: PatientCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.create_patient(db, request)

@patient_router.patch("/{patient_id}", response_model=PatientResponseSchema)
def update_patient(patient_id: int, request: PatientUpdateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.update_patient(db, patient_id, request)
@patient_router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.delete_patient(db, patient_id)
