from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.hospital import HospitalResponseSchema
from services.hospital import HospitalService

db_dependency = Annotated[Session, Depends(get_db)]

hospital_service = HospitalService()

hospital_router = APIRouter(prefix="/api/v1/hospital", tags=["hospital"])


@hospital_router.get("/", response_model=List[HospitalResponseSchema], status_code=200)
def get_hospitals(db: db_dependency, user_data=Depends(get_current_user)):
    return hospital_service.get_hospitals(db)
