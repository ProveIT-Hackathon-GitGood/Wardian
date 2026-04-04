from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from connection_manager.alert_manager import alert_manager

from database import get_db
from services.predict import PredictService

db_dependency = Annotated[Session, Depends(get_db)]

predict_service = PredictService()

predict_router = APIRouter(prefix="/api/v1/predict", tags=["predict"])


@predict_router.get("/{patient_id}", status_code=200)
async def get_prediction(db: db_dependency, patient_id):
    predict_service.predict_patient(db, patient_id=1)
    await alert_manager.broadcast({
        "type": "info",
        "message": f"Predicting patient {patient_id}...",
        "id": "predict",
        "patientId": str(patient_id)
    })

    return
