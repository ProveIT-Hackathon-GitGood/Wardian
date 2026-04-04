from sqlalchemy.orm import Session

from repositories.alert import AlertRepository
from schemas.alert import AlertCreateSchema

alert_repository = AlertRepository()


class AlertService:
    def create_alert(self, alert: AlertCreateSchema, db: Session):
        return alert_repository.create_alert(alert, db)

    def get_all_alerts(self, db: Session):
        return alert_repository.get_all_alerts(db)
