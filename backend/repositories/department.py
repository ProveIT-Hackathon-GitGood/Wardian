from models.department import Department


class DepartmentRepository:
    def add_department(self, request, db):
        new_department = Department(
            hospital_id=request.hospital_id,
            name=request.name,
        )
        db.add(new_department)
        db.commit()
        db.refresh(new_department)
        return new_department
