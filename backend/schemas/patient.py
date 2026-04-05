from datetime import datetime
from typing import Optional, List, Any

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
    ai_insight: Optional[str] = None
    diagnosis: Optional[str] = None
    performed_surgery: Optional[str] = None
    clinical_notes: Optional[str] = None
    sepsis_risk_score: Optional[float] = None
    is_active: Optional[bool] = None


class PatientCreateSchema(PatientBase):
    pass


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
    medical_history: List['PatientHistoryResponse'] = []

    class Config:
        from_attributes = True


class PatientVitalBase(BaseModel):
    patient_id: int
    timestamp: Optional[datetime] = None
    hour: Optional[float] = None

    # Vitals
    HR: Optional[float] = None
    O2Sat: Optional[float] = None
    Temp: Optional[float] = None
    SBP: Optional[float] = None
    MAP: Optional[float] = None
    DBP: Optional[float] = None
    Resp: Optional[float] = None
    EtCO2: Optional[float] = None

    # Labs
    BaseExcess: Optional[float] = None
    HCO3: Optional[float] = None
    FiO2: Optional[float] = None
    pH: Optional[float] = None
    PaCO2: Optional[float] = None
    SaO2: Optional[float] = None
    AST: Optional[float] = None
    BUN: Optional[float] = None
    Alkalinephos: Optional[float] = None
    Calcium: Optional[float] = None
    Chloride: Optional[float] = None
    Creatinine: Optional[float] = None
    Bilirubin_direct: Optional[float] = None
    Glucose: Optional[float] = None
    Lactate: Optional[float] = None
    Magnesium: Optional[float] = None
    Phosphate: Optional[float] = None
    Potassium: Optional[float] = None
    Bilirubin_total: Optional[float] = None
    TroponinI: Optional[float] = None
    Hct: Optional[float] = None
    Hgb: Optional[float] = None
    PTT: Optional[float] = None
    WBC: Optional[float] = None
    Fibrinogen: Optional[float] = None
    Platelets: Optional[float] = None

    # Context
    Unit1: Optional[float] = None
    Unit2: Optional[float] = None
    HospAdmTime: Optional[float] = None
    ICULOS: Optional[float] = None


class PatientVitalCreateSchema(PatientVitalBase):
    pass


class PatientVitalUpdateSchema(BaseModel):
    patient_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    hour: Optional[float] = None
    HR: Optional[float] = None
    O2Sat: Optional[float] = None
    Temp: Optional[float] = None
    SBP: Optional[float] = None
    MAP: Optional[float] = None
    DBP: Optional[float] = None
    Resp: Optional[float] = None
    EtCO2: Optional[float] = None
    Lactate: Optional[float] = None


class PatientVitalResponseSchema(PatientVitalBase):
    id: int

    class Config:
        from_attributes = True


class PatientHistoryBase(BaseModel):
    patient_id: int
    type: str
    title: str
    description: str
    date: str
    time: str
    details: Optional[str] = None
    surgery_type: Optional[str] = None
    attachments: Optional[List[Any]] = None


class PatientHistoryCreateSchema(BaseModel):
    type: str
    title: str
    description: str
    date: str
    time: str
    details: Optional[str] = None
    surgery_type: Optional[str] = None
    attachments: Optional[List[Any]] = None


class PatientHistoryResponse(PatientHistoryBase):
    id: int

    class Config:
        from_attributes = True
