from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)

    hospital = relationship("Hospital", back_populates="departments")
    wards = relationship("Ward", back_populates="department")
    staff = relationship("MedicalStaff", back_populates="department")
