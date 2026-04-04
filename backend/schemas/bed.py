from typing import Optional

from pydantic import BaseModel


class BedBase(BaseModel):
    ward_id: int
    bed_number: str
    is_occupied: bool = False


class BedCreateSchema(BedBase):
    pass


class BedUpdateSchema(BaseModel):
    ward_id: Optional[int] = None
    bed_number: Optional[str] = None
    is_occupied: Optional[bool] = None


class BedResponseSchema(BedBase):
    id: int

    class Config:
        from_attributes = True
