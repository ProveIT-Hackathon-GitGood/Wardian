from sqlalchemy.orm import Session, joinedload

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

    def mark_as_read(self, db: Session, alert_id: int):
        db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if db_alert:
            db_alert.is_ready = True
            db.commit()
            db.refresh(db_alert)
        return db_alert

    def get_all_alerts(self, db: Session):
        return db.query(Alert).options(joinedload(Alert.patient)).all()

