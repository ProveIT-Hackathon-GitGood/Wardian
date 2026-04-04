from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models.medical_staff import MedicalStaff
from schemas.auth import CreateMedicalStaffSchema

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class MedicalStaffRepository:
    def find_medical_staff_by_email(self, email: str, db):
        return db.query(MedicalStaff).filter(MedicalStaff.email == email).first()

    def get_all_medical_staff(self, db: Session):
        return db.query(MedicalStaff).all()

    def create_user(self, user: CreateMedicalStaffSchema, db: Session) -> MedicalStaff:
        created_user = MedicalStaff(full_name=user.full_name,
                                    email=user.email,
                                    password=bcrypt_context.hash(user.password.get_secret_value()),
                                    role=user.role)
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
