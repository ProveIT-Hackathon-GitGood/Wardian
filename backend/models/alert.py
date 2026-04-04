import datetime
import enum

from sqlalchemy import Enum as SQLEnum, DateTime, Boolean

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from database import Base


class AlertTypes(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    bed_id = Column(Integer, ForeignKey("beds.id"))
    ward_id = Column(Integer, ForeignKey("wards.id"))

    type = Column(SQLEnum(AlertTypes))
    message = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_ready = Column(Boolean, default=False)

    patient = relationship("Patient", lazy="joined")