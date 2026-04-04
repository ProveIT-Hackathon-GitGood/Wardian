from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PatientBase(BaseModel):
    bed_id: Optional[int] = None
    name: str
    age: int
    gender: str
    is_active: bool = True


class PatientCreateSchema(PatientBase):
    pass


class PatientUpdateSchema(BaseModel):
    bed_id: Optional[int] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponseSchema(PatientBase):
    id: int

    class Config:
        from_attributes = True


class PatientVitalBase(BaseModel):
    patient_id: int
    timestamp: Optional[datetime] = None
    heart_rate: float
    lactate: float
    ai_risk_score: Optional[float] = None


class PatientVitalCreateSchema(PatientVitalBase):
    pass


class PatientVitalUpdateSchema(BaseModel):
    patient_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    heart_rate: Optional[float] = None
    lactate: Optional[float] = None
    ai_risk_score: Optional[float] = None


class PatientVitalResponseSchema(PatientVitalBase):
    id: int

    class Config:
        from_attributes = True
