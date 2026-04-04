from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.medical_staff import MedicalStaffService

db_dependency = Annotated[Session, Depends(get_db)]

medical_staff_service = MedicalStaffService()

medical_router = APIRouter(prefix="/api/v1/medical-staff", tags=["medical-staff"])
