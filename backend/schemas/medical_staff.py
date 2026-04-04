from typing import Optional

from pydantic import BaseModel


class MedicalStaffBase(BaseModel):
    department_id: int
    hospital_id: int


class MedicalStaffCreateSchema(MedicalStaffBase):
    pass


class MedicalStaffUpdateSchema(BaseModel):
    department_id: Optional[int] = None
    hospital_id: Optional[int] = None


class MedicalStaffResponseSchema(MedicalStaffBase):
    id: int

    class Config:
        from_attributes = True
