from sqlalchemy.orm import Session

from repositories.hospital import HospitalRepository

hospital_repository = HospitalRepository()


class HospitalService:
    def get_hospitals(self, db: Session):
        return hospital_repository.get_hospitals(db)
