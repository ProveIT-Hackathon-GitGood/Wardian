from datetime import datetime

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    bed_id = Column(Integer, ForeignKey("beds.id"))
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    is_active = Column(Boolean, default=True)  # False dacă e externat

    bed = relationship("Bed", back_populates="patients")
    vitals = relationship("PatientVital", back_populates="patient")


class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    heart_rate = Column(Float)
    lactate = Column(Float)

    ai_risk_score = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="vitals")
