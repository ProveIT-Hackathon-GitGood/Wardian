import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql.base import UUID

from database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True, index=True, default=uuid.uuid4)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)