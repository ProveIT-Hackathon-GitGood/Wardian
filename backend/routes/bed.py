from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.bed import BedService

db_dependency = Annotated[Session, Depends(get_db)]

bed_service = BedService()

bed_router = APIRouter(prefix="/api/v1/bed", tags=["bed"])