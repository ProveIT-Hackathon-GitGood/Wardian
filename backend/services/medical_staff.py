from sqlalchemy.orm.session import Session
from fastapi import HTTPException
from schemas.medical_staff import MedicalStaffCreateSchema, MedicalStaffUpdateSchema

from repositories.medical_staff import MedicalStaffRepository

medical_staff_repository = MedicalStaffRepository()


class MedicalStaffService:
    def get_all_medical_staff(self, db: Session):
        return medical_staff_repository.get_all_medical_staff(db)

    def get_medical_staff(self, db: Session, staff_id: int):
        staff = medical_staff_repository.get_medical_staff(db, staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Medical staff not found")
        return staff

    def create_medical_staff(self, db: Session, staff_data: MedicalStaffCreateSchema):
        return medical_staff_repository.create_medical_staff(db, staff_data)

    def update_medical_staff(self, db: Session, staff_id: int, staff_data: MedicalStaffUpdateSchema):
        staff = medical_staff_repository.update_medical_staff(db, staff_id, staff_data)
        if not staff:
            raise HTTPException(status_code=404, detail="Medical staff not found")
        return staff

    def delete_medical_staff(self, db: Session, staff_id: int):
        success = medical_staff_repository.delete_medical_staff_by_id(db, staff_id)
        if not success:
            raise HTTPException(status_code=404, detail="Medical staff not found")
        return {"message": "Medical staff deleted successfully"}
