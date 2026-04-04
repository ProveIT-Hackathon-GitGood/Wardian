from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.patient import PatientService

db_dependency = Annotated[Session, Depends(get_db)]

patient_service = PatientService()

patient_router = APIRouter(prefix="/api/v1/patient", tags=["patient"])
