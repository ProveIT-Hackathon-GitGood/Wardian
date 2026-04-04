from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.ward import WardService

db_dependency = Annotated[Session, Depends(get_db)]

ward_service = WardService()

ward_router = APIRouter(prefix="/api/v1/ward", tags=["ward"])
