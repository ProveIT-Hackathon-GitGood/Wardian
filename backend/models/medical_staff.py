import enum

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class StaffRole(str, enum.Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"

class MedicalStaff(Base):
    __tablename__ = "medical_staff"
    id = Column(Integer, primary_key=True, index=True)

    department_id = Column(Integer, ForeignKey("departments.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))

    hospital = relationship("Hospital", back_populates="medical_staff")
    department = relationship("Department", back_populates="medical_staff")
