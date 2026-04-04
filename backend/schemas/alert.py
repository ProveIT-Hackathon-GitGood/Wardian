import datetime
import enum
from typing import Optional

from pydantic import BaseModel


class AlertTypes(enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


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
