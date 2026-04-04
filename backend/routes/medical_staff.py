from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.medical_staff import MedicalStaffResponseSchema
from services.medical_staff import MedicalStaffService

db_dependency = Annotated[Session, Depends(get_db)]

medical_staff_service = MedicalStaffService()

medical_staff_router = APIRouter(prefix="/api/v1/medical-staff", tags=["medical-staff"])


@medical_staff_router.get("/", response_model=List[MedicalStaffResponseSchema], status_code=200)
def get_all_medical_staff(db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.get_all_medical_staff(db)
