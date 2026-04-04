from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import MedicalStaffLoginSchema, MedicalStaffLoginOut, CreateMedicalStaffSchema
from services.auth import AuthService

db_dependency = Annotated[Session, Depends(get_db)]

auth_service = AuthService()

auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@auth_router.post("/login", response_model=MedicalStaffLoginOut)
def login_account(user: MedicalStaffLoginSchema, db: db_dependency):
    response = auth_service.login_account(user, db)
    return response


@auth_router.post("/register",  status_code=201)
def register_account(user: CreateMedicalStaffSchema, db: db_dependency):
    response = auth_service.register_account(user, db)
    return response
