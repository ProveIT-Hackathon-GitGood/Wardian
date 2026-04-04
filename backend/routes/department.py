from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.department import DepartmentResponseSchema, DepartmentCreateSchema, DepartmentUpdateSchema
from services.department import DepartmentService

db_dependency = Annotated[Session, Depends(get_db)]

department_service = DepartmentService()

department_router = APIRouter(prefix="/api/v1/department", tags=["department"])


@department_router.get("/", response_model=List[DepartmentResponseSchema])
def get_departments(db: db_dependency, user_data=Depends(get_current_user)):
    return department_service.get_departments(db)


@department_router.get("/{department_id}", response_model=DepartmentResponseSchema)
def get_department(department_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return department_service.get_department(db, department_id)


@department_router.post("/", response_model=DepartmentResponseSchema, status_code=status.HTTP_201_CREATED)
def create_department(request: DepartmentCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return department_service.create_department(db, request)


@department_router.put("/{department_id}", response_model=DepartmentResponseSchema)
def update_department(department_id: int, request: DepartmentUpdateSchema, db: db_dependency,
                      user_data=Depends(get_current_user)):
    return department_service.update_department(db, department_id, request)


@department_router.delete("/{department_id}", status_code=status.HTTP_200_OK)
def delete_department(department_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return department_service.delete_department(db, department_id)
