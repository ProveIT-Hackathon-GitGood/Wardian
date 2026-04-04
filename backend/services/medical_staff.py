from sqlalchemy.orm.session import Session

from repositories.medical_staff import MedicalStaffRepository

medical_staff_repository = MedicalStaffRepository()


class MedicalStaffService:
    def get_all_medical_staff(self, db: Session):
        return medical_staff_repository.get_all_medical_staff(db)
