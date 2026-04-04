from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.alert import AlertCreateSchema, AlertResponseSchema
from services.alert import AlertService
from connection_manager.alert_manager import alert_manager

db_dependency = Annotated[Session, Depends(get_db)]

alert_service = AlertService()

alert_router = APIRouter(prefix="/api/v1/alert", tags=["alert"])

@alert_router.post("", status_code=201)
async def create_alert(request: AlertCreateSchema, db: db_dependency):
    alert = alert_service.create_alert(request, db)
    patient_data = None
    if alert.patient:
        patient_data = {
            "id": alert.patient.id,
            "name": alert.patient.name,
            "age": alert.patient.age,
            "gender": alert.patient.gender,
            "cnp": alert.patient.cnp,
            "phone_number": alert.patient.phone_number,
            "blood_type": alert.patient.blood_type,
            "attending_physician": alert.patient.attending_physician,
            "diagnosis": alert.patient.diagnosis,
            "sepsis_risk_score": alert.patient.sepsis_risk_score,
            "is_active": alert.patient.is_active,
        }
    await alert_manager.broadcast({
        "id": alert.id,
        "patient_id": alert.patient_id,
        "bed_id": alert.bed_id,
        "ward_id": alert.ward_id,
        "type": alert.type.value if alert.type else "INFO",
        "message": alert.message,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
        "is_ready": getattr(alert, 'is_ready', False),
        "patient": patient_data,
    })
    return alert

@alert_router.get("", response_model=list[AlertResponseSchema])
def get_all_alerts(db: db_dependency):
    return alert_service.get_all_alerts(db)
