from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.bed import BedCreateSchema, BedUpdateSchema, BedResponseSchema
from services.bed import BedService

db_dependency = Annotated[Session, Depends(get_db)]

bed_service = BedService()

bed_router = APIRouter(prefix="/api/v1/bed", tags=["bed"])


@bed_router.get("/", response_model=List[BedResponseSchema])
def get_beds(db: db_dependency, user_data=Depends(get_current_user)):
    return bed_service.get_beds(db)


@bed_router.get("/{bed_id}", response_model=BedResponseSchema)
def get_bed(bed_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return bed_service.get_bed(db, bed_id)


@bed_router.post("/", response_model=BedResponseSchema, status_code=status.HTTP_201_CREATED)
def create_bed(request: BedCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return bed_service.create_bed(db, request)


@bed_router.put("/{bed_id}", response_model=BedResponseSchema)
def update_bed(bed_id: int, request: BedUpdateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return bed_service.update_bed(db, bed_id, request)


@bed_router.delete("/{bed_id}", status_code=status.HTTP_200_OK)
def delete_bed(bed_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return bed_service.delete_bed(db, bed_id)
