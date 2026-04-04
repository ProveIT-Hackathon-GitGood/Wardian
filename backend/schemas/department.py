from typing import Optional

from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str
    hospital_id: int


class DepartmentCreateSchema(DepartmentBase):
    pass


class DepartmentUpdateSchema(BaseModel):
    name: Optional[str] = None
    hospital_id: Optional[int] = None


class DepartmentResponseSchema(DepartmentBase):
    id: int

    class Config:
        from_attributes = True
