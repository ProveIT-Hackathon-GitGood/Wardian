from sqlalchemy.orm import Session

from models.employer_code import EmployerCode


class EmployeeCodeRepository:
    def verify_employer_code(self, employer_code, db: Session):
        employer_code = db.query(EmployerCode).filter(EmployerCode.code == employer_code).first()
        if not employer_code:
            return False
        return True
