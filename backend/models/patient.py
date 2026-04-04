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
    cnp = Column(String)
    phone_number = Column(String)
    emergency_contact = Column(String)
    blood_type = Column(String)
    allergies = Column(String)
    ai_insight = Column(String, nullable=True)
    admission_date = Column(DateTime)
    diagnosis = Column(String, nullable=True)
    performed_surgery = Column(String, nullable=True)
    clinical_notes = Column(String, nullable=True)
    sepsis_risk_score = Column(Float)

    is_active = Column(Boolean, default=True)

    bed = relationship("Bed", back_populates="patients")
    vitals = relationship("PatientVital", back_populates="patient")


class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    heart_rate = Column(Float)
    lactate = Column(Float)
    blood_pressure = Column(Float)
    oxygen_saturation = Column(Float)
    respiratory_rate = Column(Float)
    recorded_at = Column(DateTime)



    patient = relationship("Patient", back_populates="vitals")
