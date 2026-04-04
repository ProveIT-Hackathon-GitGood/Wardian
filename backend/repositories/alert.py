from sqlalchemy.orm import Session

from models.alert import Alert
from schemas.alert import AlertCreateSchema


class AlertRepository:
    def create_alert(self, alert: AlertCreateSchema, db: Session):
        created_alert = Alert(
            patient_id=alert.patient_id,
            bed_id=alert.bed_id,
            ward_id=alert.ward_id,
            type=alert.type,
            message=alert.message,
        )
        saved_alert = self.save_alert(created_alert, db)
        return saved_alert

    def save_alert(self, alert: Alert, db: Session):
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    def delete_alert(self, alert: Alert, db: Session):
        db.delete(alert)
        db.commit()
        return True

    def get_all_alerts(self, db: Session):
        return db.query(Alert).all()
