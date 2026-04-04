from sqlalchemy.orm import Session

from models.hospital import Hospital
from schemas.hospital import HospitalCreateSchema, HospitalUpdateSchema


class HospitalRepository:
    def get_hospital(self, db: Session, hospital_id: int):
        return db.query(Hospital).filter(Hospital.id == hospital_id).first()

    def get_hospitals(self, db: Session):
        return db.query(Hospital).all()

    def create_hospital(self, db: Session, hospital_data: HospitalCreateSchema):
        db_hospital = Hospital(**hospital_data.model_dump())
        db.add(db_hospital)
        db.commit()
        db.refresh(db_hospital)
        return db_hospital

    def update_hospital(self, db: Session, hospital_id: int, hospital_data: HospitalUpdateSchema):
        db_hospital = self.get_hospital(db, hospital_id)
        if not db_hospital:
            return None

        update_data = hospital_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_hospital, key, value)

        db.commit()
        db.refresh(db_hospital)
        return db_hospital

    def delete_hospital(self, db: Session, hospital_id: int):
        db_hospital = self.get_hospital(db, hospital_id)
        if not db_hospital:
            return False

        db.delete(db_hospital)
        db.commit()
        return True
