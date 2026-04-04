from sqlalchemy import Column, String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    bed_number = Column(String)
    is_occupied = Column(Boolean, default=False)

    ward = relationship("Ward", back_populates="beds")
    patients = relationship("Patient", back_populates="bed")
