from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.alert import AlertCreateSchema
from services.alert import AlertService

db_dependency = Annotated[Session, Depends(get_db)]

alert_service = AlertService()

alert_router = APIRouter(prefix="/api/v1/alert", tags=["alert"])

alert_router.post("", status_code=201)


def create_alert(request: AlertCreateSchema, db: db_dependency):
    return alert_service.create_alert(request, db)
