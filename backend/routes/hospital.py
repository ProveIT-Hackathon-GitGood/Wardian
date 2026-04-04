from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.hospital import HospitalService

db_dependency = Annotated[Session, Depends(get_db)]

hospital_service = HospitalService()

hospital_router = APIRouter(prefix="/api/v1/hospital", tags=["hospital"])