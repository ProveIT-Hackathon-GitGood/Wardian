from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.ward import WardCreateSchema, WardUpdateSchema, WardResponseSchema
from services.ward import WardService

db_dependency = Annotated[Session, Depends(get_db)]

ward_service = WardService()

ward_router = APIRouter(prefix="/api/v1/ward", tags=["ward"])


@ward_router.get("/", response_model=List[WardResponseSchema])
def get_wards(db: db_dependency, user_data=Depends(get_current_user)):
    return ward_service.get_wards(db)


@ward_router.get("/{ward_id}", response_model=WardResponseSchema)
def get_ward(ward_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return ward_service.get_ward(db, ward_id)


@ward_router.post("/", response_model=WardResponseSchema, status_code=status.HTTP_201_CREATED)
def create_ward(request: WardCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return ward_service.create_ward(db, request)


@ward_router.put("/{ward_id}", response_model=WardResponseSchema)
def update_ward(ward_id: int, request: WardUpdateSchema, db: db_dependency,
                user_data=Depends(get_current_user)):
    return ward_service.update_ward(db, ward_id, request)


@ward_router.delete("/{ward_id}", status_code=status.HTTP_200_OK)
def delete_ward(ward_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return ward_service.delete_ward(db, ward_id)
