import enum
from typing import Optional

from pydantic import BaseModel


class StaffRole(str, enum.Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"


class MedicalStaffBase(BaseModel):
    email: str
    full_name: str
    department_id: int
    hospital_id: int
    role: StaffRole


class MedicalStaffCreateSchema(MedicalStaffBase):
    password: str
    pass


class MedicalStaffUpdateSchema(BaseModel):
    department_id: Optional[int] = None
    hospital_id: Optional[int] = None


class MedicalStaffResponseSchema(MedicalStaffBase):
    id: int

    class Config:
        from_attributes = True
