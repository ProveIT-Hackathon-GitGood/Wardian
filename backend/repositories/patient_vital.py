from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models.patient import PatientVital
from schemas.patient import PatientVitalCreateSchema, PatientVitalUpdateSchema


class PatientVitalRepository:
    def get_vitals_by_patient(self, db: Session, patient_id: int):
        return (
            db.query(PatientVital)
            .filter(PatientVital.patient_id == patient_id)
            .order_by(PatientVital.timestamp.desc())
            .all()
        )

    def get_recent_vitals(self, db: Session, patient_id: int, hours: int = 24):
        """Fetch vitals from the last `hours` hours, ordered ascending by hour for ML pipeline."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return (
            db.query(PatientVital)
            .filter(
                PatientVital.patient_id == patient_id,
                PatientVital.timestamp >= cutoff,
            )
            .order_by(PatientVital.hour.asc())
            .all()
        )

    def get_latest_vital(self, db: Session, patient_id: int):
        return (
            db.query(PatientVital)
            .filter(PatientVital.patient_id == patient_id)
            .order_by(PatientVital.timestamp.desc())
            .first()
        )

    def get_vital_by_id(self, db: Session, vital_id: int):
        return db.query(PatientVital).filter(PatientVital.id == vital_id).first()

    def create_vital(self, db: Session, vital_data: PatientVitalCreateSchema):
        db_vital = PatientVital(**vital_data.model_dump())
        db.add(db_vital)
        db.commit()
        db.refresh(db_vital)
        return db_vital

    def update_vital(self, db: Session, vital_id: int, vital_data: PatientVitalUpdateSchema):
        db_vital = self.get_vital_by_id(db, vital_id)
        if not db_vital:
            return None

        update_data = vital_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vital, key, value)

        db.commit()
        db.refresh(db_vital)
        return db_vital

    def delete_vital(self, db: Session, vital_id: int):
        db_vital = self.get_vital_by_id(db, vital_id)
        if not db_vital:
            return False

        db.delete(db_vital)
        db.commit()
        return True
