from sqlalchemy.orm import Session

from exceptions.exceptions import AppException
from repositories.medical_staff import MedicalStaffRepository
from repositories.employee_code import EmployeeCodeRepository
from schemas.auth import MedicalStaffLoginSchema, CreateMedicalStaffSchema
from utils.jwt_handler import sign_jwt

user_repository = MedicalStaffRepository()
employee_code_repository = EmployeeCodeRepository()


class AuthService:
    def login_account(self, user: MedicalStaffLoginSchema, db: Session):
        existing_user = user_repository.find_medical_staff_by_email(user.email, db)

        if not existing_user:
            raise AppException("User not found", 404)
        if not user_repository.authenticate_user(user.password.get_secret_value(), existing_user.password):
            raise AppException("Invalid credentials", 401)
        return sign_jwt(existing_user.email, existing_user.id, existing_user.role)

    def register_account(self, user: CreateMedicalStaffSchema, db: Session):
        if employee_code_repository.verify_employee_code(user.employee_code, db) is False:
            raise AppException("Invalid employer code", 400)
        if user_repository.find_medical_staff_by_email(user.email, db):
            raise AppException("User already exists", 409)
        return user_repository.create_user(user, db)
