from sqlalchemy.orm import Session

from models.ward import Ward
from schemas.ward import WardCreateSchema, WardUpdateSchema


class WardRepository:
    def get_ward(self, db: Session, ward_id: int):
        return db.query(Ward).filter(Ward.id == ward_id).first()

    def get_wards(self, db: Session):
        return db.query(Ward).all()

    def create_ward(self, db: Session, ward_data: WardCreateSchema):
        db_ward = Ward(**ward_data.model_dump())
        db.add(db_ward)
        db.commit()
        db.refresh(db_ward)
        return db_ward

    def update_ward(self, db: Session, ward_id: int, ward_data: WardUpdateSchema):
        db_ward = self.get_ward(db, ward_id)
        if not db_ward:
            return None

        update_data = ward_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ward, key, value)

        db.commit()
        db.refresh(db_ward)
        return db_ward

    def delete_ward(self, db: Session, ward_id: int):
        db_ward = self.get_ward(db, ward_id)
        if not db_ward:
            return False

        db.delete(db_ward)
        db.commit()
        return True