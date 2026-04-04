
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from database import Base


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    room_number = Column(String)

    department = relationship("Department", back_populates="wards")
    beds = relationship("Bed", back_populates="room")