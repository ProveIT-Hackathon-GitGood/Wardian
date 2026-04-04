from sqlalchemy.orm import Session

from models.employee_code import EmployeeCode


class EmployeeCodeRepository:
    def verify_employee_code(self, employee_code, db: Session):
        employee_code = db.query(EmployeeCode).filter(EmployeeCode.code == employee_code).first()
        if not employee_code:
            return False
        return True
