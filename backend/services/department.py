from repositories.department import DepartmentRepository
from schemas.department import DepartmentCreateSchema

department_repository = DepartmentRepository()


class DepartmentService:
    def get_departments(self, db):
        return department_repository.get_departments(db)

    def add_department(self, request: DepartmentCreateSchema, db):
        return department_repository.add_department(request, db)
