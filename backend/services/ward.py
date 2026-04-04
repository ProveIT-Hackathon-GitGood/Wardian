from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.ward import WardRepository
from schemas.ward import WardCreateSchema, WardUpdateSchema

ward_repository = WardRepository()


class WardService:
    def get_ward(self, db: Session, ward_id: int):
        ward = ward_repository.get_ward(db, ward_id)
        if not ward:
            raise HTTPException(status_code=404, detail="Ward not found")
        return ward

    def get_wards(self, db: Session):
        return ward_repository.get_wards(db)

    def create_ward(self, db: Session, ward_data: WardCreateSchema):
        return ward_repository.create_ward(db, ward_data)

    def update_ward(self, db: Session, ward_id: int, ward_data: WardUpdateSchema):
        ward = ward_repository.update_ward(db, ward_id, ward_data)
        if not ward:
            raise HTTPException(status_code=404, detail="Ward not found")
        return ward

    def delete_ward(self, db: Session, ward_id: int):
        success = ward_repository.delete_ward(db, ward_id)
        if not success:
            raise HTTPException(status_code=404, detail="Ward not found")
        return {"message": "Ward deleted successfully"}
