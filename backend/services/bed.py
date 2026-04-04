from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.bed import BedRepository
from schemas.bed import BedCreateSchema, BedUpdateSchema

bed_repository = BedRepository()

class BedService:
    def get_bed(self, db: Session, bed_id: int):
        bed = bed_repository.get_bed(db, bed_id)
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        return bed
        
    def get_beds(self, db: Session):
        return bed_repository.get_beds(db)

    def create_bed(self, db: Session, bed_data: BedCreateSchema):
        return bed_repository.create_bed(db, bed_data)

    def update_bed(self, db: Session, bed_id: int, bed_data: BedUpdateSchema):
        bed = bed_repository.update_bed(db, bed_id, bed_data)
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        return bed

    def delete_bed(self, db: Session, bed_id: int):
        success = bed_repository.delete_bed(db, bed_id)
        if not success:
            raise HTTPException(status_code=404, detail="Bed not found")
        return {"message": "Bed deleted successfully"}
