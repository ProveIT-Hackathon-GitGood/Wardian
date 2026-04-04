from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.department import DepartmentResponseSchema, DepartmentCreateSchema
from services.department import DepartmentService

db_dependency = Annotated[Session, Depends(get_db)]

department_service = DepartmentService()

department_router = APIRouter(prefix="/api/v1/department", tags=["department"])


@department_router.get("/", response_model=List[DepartmentResponseSchema])
def get_departments(db: db_dependency, user_data=Depends(get_current_user)):
    return department_service.get_departments(db)


@department_router.post("/", response_model=DepartmentResponseSchema, status_code=201)
def add_department(request: DepartmentCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    response = department_service.create_department(db, request)
    return response
