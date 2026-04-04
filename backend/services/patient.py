from sqlalchemy.orm import Session
from fastapi import HTTPException

from repositories.patient import PatientRepository
from schemas.patient import PatientCreateSchema, PatientUpdateSchema

patient_repository = PatientRepository()


class PatientService:
    def get_patients(self, db: Session):
        return patient_repository.get_patients(db)

    def get_patient(self, db: Session, patient_id: int):
        patient = patient_repository.get_patient(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient

    def create_patient(self, db: Session, request: PatientCreateSchema):
        return patient_repository.create_patient(db, request)

    def update_patient(self, db: Session, patient_id: int, request: PatientUpdateSchema):
        patient = patient_repository.update_patient(db, patient_id, request)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient

    def delete_patient(self, db: Session, patient_id: int):
        success = patient_repository.delete_patient(db, patient_id)
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {"message": "Patient deleted successfully"}
