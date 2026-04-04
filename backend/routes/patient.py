from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.patient import PatientCreateSchema, PatientResponseSchema
from services.patient import PatientService

db_dependency = Annotated[Session, Depends(get_db)]

patient_service = PatientService()

patient_router = APIRouter(prefix="/api/v1/patient", tags=["patient"])


@patient_router.post("", response_model=PatientResponseSchema, status_code=201)
def create_patient(request: PatientCreateSchema, db: db_dependency,
                   user_data=Depends(get_current_user)):
    return patient_service.create_patient(db, request)
