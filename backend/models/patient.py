import enum
from datetime import datetime

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship

from database import Base
from sqlalchemy import Enum as SQLEnum


class Status(enum.Enum):
    STABLE = 'stable'
    WARNING = 'warning'
    CRITICAL = 'critical'


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
    status = Column(SQLEnum(Status), default=Status.STABLE)
    sepsis_risk_score = Column(Float)
    ai_insight = Column(String, nullable=True)
    admission_date = Column(DateTime)
    diagnosis = Column(String, nullable=True)
    performed_surgery = Column(String, nullable=True)
    clinical_notes = Column(String, nullable=True)

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
    blood_pressure = Column(Float)
    oxygen_saturation = Column(Float)
    respiratory_rate = Column(Float)
    recorded_at = Column(DateTime)

    ai_risk_score = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="vitals")
