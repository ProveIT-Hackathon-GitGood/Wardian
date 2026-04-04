from sqlalchemy.orm import Session
from models.bed import Bed
from schemas.bed import BedCreateSchema, BedUpdateSchema

class BedRepository:
    def get_bed(self, db: Session, bed_id: int):
        return db.query(Bed).filter(Bed.id == bed_id).first()

    def get_beds(self, db: Session):
        return db.query(Bed).all()

    def create_bed(self, db: Session, bed_data: BedCreateSchema) -> Bed:
        db_bed = Bed(**bed_data.model_dump())
        db.add(db_bed)
        db.commit()
        db.refresh(db_bed)
        return db_bed

    def update_bed(self, db: Session, bed_id: int, bed_data: BedUpdateSchema):
        db_bed = self.get_bed(db, bed_id)
        if not db_bed:
            return None
            
        update_data = bed_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_bed, key, value)
            
        db.commit()
        db.refresh(db_bed)
        return db_bed

    def delete_bed(self, db: Session, bed_id: int):
        db_bed = self.get_bed(db, bed_id)
        if not db_bed:
            return False
            
        db.delete(db_bed)
        db.commit()
        return True