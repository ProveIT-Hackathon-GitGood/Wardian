from sqlalchemy.orm import Session

from repositories.patient import PatientRepository
from schemas.patient import PatientCreateSchema

patient_repository = PatientRepository()


class PatientService:
    def create_patient(self, db: Session, request: PatientCreateSchema):
        return patient_repository.create_patient(db, request)
