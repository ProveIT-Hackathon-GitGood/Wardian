from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.department import DepartmentRepository
from schemas.department import DepartmentCreateSchema, DepartmentUpdateSchema

department_repository = DepartmentRepository()

class DepartmentService:
    def get_department(self, db: Session, department_id: int):
        department = department_repository.get_department(db, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        return department
        
    def get_departments(self, db: Session):
        return department_repository.get_departments(db)

    def create_department(self, db: Session, department_data: DepartmentCreateSchema):
        return department_repository.create_department(db, department_data)

    def update_department(self, db: Session, department_id: int, department_data: DepartmentUpdateSchema):
        department = department_repository.update_department(db, department_id, department_data)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        return department

    def delete_department(self, db: Session, department_id: int):
        success = department_repository.delete_department(db, department_id)
        if not success:
            raise HTTPException(status_code=404, detail="Department not found")
        return {"message": "Department deleted successfully"}
