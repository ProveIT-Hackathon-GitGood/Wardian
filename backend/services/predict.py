from sqlalchemy.orm import Session

from connection_manager.alert_manager import alert_manager
from services.alert import AlertService

alert_service = AlertService()


class PredictService:
    def predict_patient(self, db: Session, patient_id: int):
        pass

