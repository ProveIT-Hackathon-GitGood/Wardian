from sqlalchemy import Column, String, Integer

from database import Base


class EmployerCode(Base):
    __tablename__ = "employer_code"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
