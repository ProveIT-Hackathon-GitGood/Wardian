from sqlalchemy.orm import Session
from models.department import Department
from schemas.department import DepartmentCreateSchema, DepartmentUpdateSchema


class DepartmentRepository:
    def get_department(self, db: Session, department_id: int):
        return db.query(Department).filter(Department.id == department_id).first()

    def get_departments(self, db: Session):
        return db.query(Department).all()

    def create_department(self, db: Session, department_data: DepartmentCreateSchema):
        db_department = Department(**department_data.model_dump())
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        return db_department

    def update_department(self, db: Session, department_id: int, department_data: DepartmentUpdateSchema):
        db_department = self.get_department(db, department_id)
        if not db_department:
            return None

        update_data = department_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_department, key, value)

        db.commit()
        db.refresh(db_department)
        return db_department

    def delete_department(self, db: Session, department_id: int):
        db_department = self.get_department(db, department_id)
        if not db_department:
            return False

        db.delete(db_department)
        db.commit()
        return True
