from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.hospital import HospitalRepository
from schemas.hospital import HospitalCreateSchema, HospitalUpdateSchema

hospital_repository = HospitalRepository()


class HospitalService:
    def get_hospital(self, db: Session, hospital_id: int):
        hospital = hospital_repository.get_hospital(db, hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return hospital
        
    def get_hospitals(self, db: Session):
        return hospital_repository.get_hospitals(db)

    def create_hospital(self, db: Session, hospital_data: HospitalCreateSchema):
        return hospital_repository.create_hospital(db, hospital_data)

    def update_hospital(self, db: Session, hospital_id: int, hospital_data: HospitalUpdateSchema):
        hospital = hospital_repository.update_hospital(db, hospital_id, hospital_data)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return hospital

    def delete_hospital(self, db: Session, hospital_id: int):
        success = hospital_repository.delete_hospital(db, hospital_id)
        if not success:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return {"message": "Hospital deleted successfully"}
