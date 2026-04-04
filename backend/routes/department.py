from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.department import DepartmentService

db_dependency = Annotated[Session, Depends(get_db)]

department_service = DepartmentService()

department_router = APIRouter(prefix="/api/v1/department", tags=["department"])
