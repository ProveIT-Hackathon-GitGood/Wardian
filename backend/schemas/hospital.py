from typing import Optional

from pydantic import BaseModel


class HospitalBase(BaseModel):
    name: str


class HospitalCreateSchema(HospitalBase):
    pass


class HospitalUpdateSchema(BaseModel):
    name: Optional[str] = None


class HospitalResponseSchema(HospitalBase):
    id: int

    class Config:
        from_attributes = True
