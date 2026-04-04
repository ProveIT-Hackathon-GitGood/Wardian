from sqlalchemy.orm import Session

from models.hospital import Hospital


class HospitalRepository:
    def get_hospitals(self, db: Session):
        return db.query(Hospital).all()
