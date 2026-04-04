from sqlalchemy import Column, String, Integer

from database import Base


class EmployeeCode(Base):
    __tablename__ = "employee_code"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
