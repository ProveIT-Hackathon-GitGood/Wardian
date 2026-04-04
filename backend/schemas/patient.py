from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PatientBase(BaseModel):
    bed_id: Optional[int] = None
    name: str
    age: int
    gender: str
    cnp: str
    phone_number: str
    emergency_contact_name: str
    emergency_contact: str
    attending_physician: str
    blood_type: str
    allergies: Optional[str] = None
    admission_date: datetime


class PatientCreateSchema(PatientBase):
    ai_insight: Optional[str] = None
    diagnosis: Optional[str] = None
    performed_surgery: Optional[str] = None
    clinical_notes: Optional[str] = None
    sepsis_risk_score: Optional[float] = None
    is_active: Optional[bool] = None


class PatientUpdateSchema(BaseModel):
    bed_id: Optional[int] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None
    cnp: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    attending_physician: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None


class PatientResponseSchema(PatientBase):
    id: int

    class Config:
        from_attributes = True


class PatientVitalBase(BaseModel):
    patient_id: int
    heart_rate: Optional[float] = None
    lactate: Optional[float] = None
    blood_pressure: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    respiratory_rate: Optional[float] = None
    recorded_at: Optional[datetime] = None


class PatientVitalCreateSchema(PatientVitalBase):
    heart_rate: float
    lactate: float
    blood_pressure: float
    oxygen_saturation: float
    respiratory_rate: float


class PatientVitalUpdateSchema(BaseModel):
    heart_rate: Optional[float] = None
    lactate: Optional[float] = None
    blood_pressure: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    respiratory_rate: Optional[float] = None
    recorded_at: Optional[datetime] = None


class PatientVitalResponseSchema(PatientVitalBase):
    id: int
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
