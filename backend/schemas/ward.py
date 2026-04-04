from typing import Optional

from pydantic import BaseModel


class WardBase(BaseModel):
    department_id: int
    room_number: str


class WardCreateSchema(WardBase):
    pass


class WardUpdateSchema(BaseModel):
    department_id: Optional[int] = None
    room_number: Optional[str] = None


class WardResponseSchema(WardBase):
    id: int

    class Config:
        from_attributes = True
