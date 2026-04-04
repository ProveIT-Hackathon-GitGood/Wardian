from sqlalchemy.orm import Session
from fastapi import HTTPException

from repositories.patient_vital import PatientVitalRepository
from schemas.patient import PatientVitalCreateSchema, PatientVitalUpdateSchema

patient_vital_repository = PatientVitalRepository()


class PatientVitalService:
    def get_vitals_by_patient(self, db: Session, patient_id: int):
        return patient_vital_repository.get_vitals_by_patient(db, patient_id)

    def get_latest_vital(self, db: Session, patient_id: int):
        vital = patient_vital_repository.get_latest_vital(db, patient_id)
        if not vital:
            raise HTTPException(status_code=404, detail="No vitals found for this patient")
        return vital

    def get_vital_by_id(self, db: Session, vital_id: int):
        vital = patient_vital_repository.get_vital_by_id(db, vital_id)
        if not vital:
            raise HTTPException(status_code=404, detail="Vital record not found")
        return vital

    def create_vital(self, db: Session, vital_data: PatientVitalCreateSchema):
        return patient_vital_repository.create_vital(db, vital_data)

    def update_vital(self, db: Session, vital_id: int, vital_data: PatientVitalUpdateSchema):
        vital = patient_vital_repository.update_vital(db, vital_id, vital_data)
        if not vital:
            raise HTTPException(status_code=404, detail="Vital record not found")
        return vital

    def delete_vital(self, db: Session, vital_id: int):
        success = patient_vital_repository.delete_vital(db, vital_id)
        if not success:
            raise HTTPException(status_code=404, detail="Vital record not found")
        return {"message": "Vital record deleted successfully"}
