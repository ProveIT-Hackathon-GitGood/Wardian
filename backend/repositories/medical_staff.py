from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models.medical_staff import MedicalStaff
from schemas.auth import CreateMedicalStaffSchema
from schemas.medical_staff import MedicalStaffCreateSchema, MedicalStaffUpdateSchema

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class MedicalStaffRepository:
    def find_medical_staff_by_email(self, email: str, db):
        return db.query(MedicalStaff).filter(MedicalStaff.email == email).first()

    def get_all_medical_staff(self, db: Session):
        return db.query(MedicalStaff).all()

    def create_user(self, user: CreateMedicalStaffSchema, db: Session):
        created_user = MedicalStaff(full_name=user.full_name,
                                    email=user.email,
                                    password=bcrypt_context.hash(user.password.get_secret_value()),
                                    role=user.role,
                                    hospital_id=user.hospital_id,
                                    department_id=user.department_id)
        saved_user = self.save_medical_staff(created_user, db)
        return saved_user

    def authenticate_user(self, current_password: str, actual_password: str):
        return bcrypt_context.verify(current_password, actual_password)

    def save_medical_staff(self, user: MedicalStaff, db: Session):
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def delete_medical_staff(self, user: MedicalStaff, db: Session):
        db.delete(user)
        db.commit()
        return True

    def get_medical_staff(self, db: Session, staff_id: int):
        return db.query(MedicalStaff).filter(MedicalStaff.id == staff_id).first()

    def create_medical_staff(self, db: Session, staff_data: MedicalStaffCreateSchema):
        db_staff = MedicalStaff(**staff_data.model_dump())
        db.add(db_staff)
        db.commit()
        db.refresh(db_staff)
        return db_staff

    def update_medical_staff(self, db: Session, staff_id: int, staff_data: MedicalStaffUpdateSchema):
        db_staff = self.get_medical_staff(db, staff_id)
        if not db_staff:
            return None

        update_data = staff_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_staff, key, value)

        db.commit()
        db.refresh(db_staff)
        return db_staff

    def delete_medical_staff_by_id(self, db: Session, staff_id: int):
        db_staff = self.get_medical_staff(db, staff_id)
        if not db_staff:
            return False

        db.delete(db_staff)
        db.commit()
        return True
