from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.hospital import HospitalResponseSchema, HospitalCreateSchema, HospitalUpdateSchema
from services.hospital import HospitalService

db_dependency = Annotated[Session, Depends(get_db)]

hospital_service = HospitalService()

hospital_router = APIRouter(prefix="/api/v1/hospital", tags=["hospital"])


@hospital_router.get("/", response_model=List[HospitalResponseSchema])
def get_hospitals(db: db_dependency, user_data=Depends(get_current_user)):
    return hospital_service.get_hospitals(db)


@hospital_router.get("/{hospital_id}", response_model=HospitalResponseSchema)
def get_hospital(hospital_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return hospital_service.get_hospital(db, hospital_id)


@hospital_router.post("/", response_model=HospitalResponseSchema, status_code=status.HTTP_201_CREATED)
def create_hospital(request: HospitalCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return hospital_service.create_hospital(db, request)


@hospital_router.put("/{hospital_id}", response_model=HospitalResponseSchema)
def update_hospital(hospital_id: int, request: HospitalUpdateSchema, db: db_dependency,
                    user_data=Depends(get_current_user)):
    return hospital_service.update_hospital(db, hospital_id, request)


@hospital_router.delete("/{hospital_id}", status_code=status.HTTP_200_OK)
def delete_hospital(hospital_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return hospital_service.delete_hospital(db, hospital_id)
