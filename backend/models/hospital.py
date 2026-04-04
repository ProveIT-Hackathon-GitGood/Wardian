from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)

    departments = relationship("Department", back_populates="hospital")
    medical_staff = relationship("MedicalStaff", back_populates="hospital")
