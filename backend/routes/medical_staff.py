from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.medical_staff import MedicalStaffResponseSchema, MedicalStaffCreateSchema, MedicalStaffUpdateSchema
from services.medical_staff import MedicalStaffService

db_dependency = Annotated[Session, Depends(get_db)]

medical_staff_service = MedicalStaffService()

medical_staff_router = APIRouter(prefix="/api/v1/medical-staff", tags=["medical-staff"])


@medical_staff_router.get("/", response_model=List[MedicalStaffResponseSchema], status_code=200)
def get_all_medical_staff(db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.get_all_medical_staff(db)

@medical_staff_router.get("/{staff_id}", response_model=MedicalStaffResponseSchema)
def get_medical_staff(staff_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.get_medical_staff(db, staff_id)

@medical_staff_router.post("/", response_model=MedicalStaffResponseSchema, status_code=status.HTTP_201_CREATED)
def create_medical_staff(request: MedicalStaffCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.create_medical_staff(db, request)

@medical_staff_router.put("/{staff_id}", response_model=MedicalStaffResponseSchema)
def update_medical_staff(staff_id: int, request: MedicalStaffUpdateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.update_medical_staff(db, staff_id, request)

@medical_staff_router.delete("/{staff_id}", status_code=status.HTTP_200_OK)
def delete_medical_staff(staff_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return medical_staff_service.delete_medical_staff(db, staff_id)
