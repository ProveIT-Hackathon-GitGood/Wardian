import datetime
import enum
from typing import Optional

from pydantic import BaseModel


class AlertTypes(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class AlertPatientSchema(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    cnp: Optional[str] = None
    phone_number: Optional[str] = None
    blood_type: Optional[str] = None
    attending_physician: Optional[str] = None
    diagnosis: Optional[str] = None
    sepsis_risk_score: Optional[float] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True


class AlertCreateSchema(BaseModel):
    patient_id: int
    bed_id: int
    ward_id: int

    type: AlertTypes
    message: Optional[str] = None


class AlertResponseSchema(BaseModel):
    id: int
    patient_id: int
    bed_id: int
    ward_id: int

    type: AlertTypes
    message: Optional[str] = None

    created_at: datetime.datetime
    is_ready: bool

    patient: Optional[AlertPatientSchema] = None

    class Config:
        from_attributes = True
