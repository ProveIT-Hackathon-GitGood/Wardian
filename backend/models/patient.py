from datetime import datetime

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    bed_id = Column(Integer, ForeignKey("beds.id"))
    name = Column(String)
    Age = Column(Integer)
    Gender = Column(String)
    cnp = Column(String, index=True)
    phone_number = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact = Column(String)
    attending_physician = Column(String)
    blood_type = Column(String)
    allergies = Column(String)
    ai_insight = Column(String, nullable=True)
    admission_date = Column(DateTime)
    diagnosis = Column(String, nullable=True)
    performed_surgery = Column(String, nullable=True)
    clinical_notes = Column(String, nullable=True)
    sepsis_risk_score = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True)

    bed = relationship("Bed", back_populates="patients")
    vitals = relationship("PatientVital", back_populates="patient")


class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    hour = Column(Float, nullable=True)

    # --- Vital signs (PhysioNet nomenclature) ---
    HR = Column(Float, nullable=True)
    O2Sat = Column(Float, nullable=True)
    Temp = Column(Float, nullable=True)
    SBP = Column(Float, nullable=True)
    MAP = Column(Float, nullable=True)
    DBP = Column(Float, nullable=True)
    Resp = Column(Float, nullable=True)
    EtCO2 = Column(Float, nullable=True)

    # --- Laboratory results (PhysioNet nomenclature) ---
    BaseExcess = Column(Float, nullable=True)
    HCO3 = Column(Float, nullable=True)
    FiO2 = Column(Float, nullable=True)
    pH = Column(Float, nullable=True)
    PaCO2 = Column(Float, nullable=True)
    SaO2 = Column(Float, nullable=True)
    AST = Column(Float, nullable=True)
    BUN = Column(Float, nullable=True)
    Alkalinephos = Column(Float, nullable=True)
    Calcium = Column(Float, nullable=True)
    Chloride = Column(Float, nullable=True)
    Creatinine = Column(Float, nullable=True)
    Bilirubin_direct = Column(Float, nullable=True)
    Glucose = Column(Float, nullable=True)
    Lactate = Column(Float, nullable=True)
    Magnesium = Column(Float, nullable=True)
    Phosphate = Column(Float, nullable=True)
    Potassium = Column(Float, nullable=True)
    Bilirubin_total = Column(Float, nullable=True)
    TroponinI = Column(Float, nullable=True)
    Hct = Column(Float, nullable=True)
    Hgb = Column(Float, nullable=True)
    PTT = Column(Float, nullable=True)
    WBC = Column(Float, nullable=True)
    Fibrinogen = Column(Float, nullable=True)
    Platelets = Column(Float, nullable=True)

    # --- Context (carried per vital record for ML compatibility) ---
    Unit1 = Column(Float, nullable=True)
    Unit2 = Column(Float, nullable=True)
    HospAdmTime = Column(Float, nullable=True)
    ICULOS = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="vitals")
