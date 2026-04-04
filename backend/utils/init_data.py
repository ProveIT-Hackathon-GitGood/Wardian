from database import SessionLocal
from models.employee_code import EmployeeCode
from models.hospital import Hospital
from models.department import Department

def init_db_data():
    db = SessionLocal()
    try:
        hospital = db.query(Hospital).first()
        if not hospital:
            hospital = Hospital(name="General Hospital")
            db.add(hospital)
            db.commit()
            db.refresh(hospital)
            print("Added default Hospital: General Hospital")

        department = db.query(Department).first()
        if not department:
            department = Department(name="Emergency Department", hospital_id=hospital.id)
            db.add(department)
            db.commit()
            print("Added default Department: Emergency Department")
        

        employee_code = db.query(EmployeeCode).first()
        if not employee_code:
            employee_code = EmployeeCode(code="123456")
            db.add(employee_code)
            db.commit()
            print("Added default Employee Code: 123456")
            
    except Exception as e:
        print(f"Error initializing default data: {e}")
        db.rollback()
    finally:
        db.close()
