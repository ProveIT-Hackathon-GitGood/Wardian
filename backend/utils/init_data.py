import random

from database import SessionLocal
from models.bed import Bed
from models.employee_code import EmployeeCode
from models.hospital import Hospital
from models.department import Department
from models.ward import Ward


HOSPITALS = [
    "Parhon", "Sf. Spiridon", "Sf. Maria", "Sf. Pantelimon", "Sf. Ioan", "Sf. Andrei"
]

DEPARTMENTS = [
    "2nd Floor Cardiology", "3rd Floor Neurology", "4th Floor Oncology", "5th Floor Pediatrics", "6th Floor Orthopedics"
]

WARDS = [
    "Ward A", "Ward B", "Ward C", "Ward D", "Ward E", "Ward F"
]


def init_db_data():
    db = SessionLocal()
    try:
        hospital_ids = [h.id for h in db.query(Hospital).all()]
        if not hospital_ids:
            for hospital_name in HOSPITALS:
                hospital = Hospital(name=hospital_name)
                db.add(hospital)
                db.commit()
                db.refresh(hospital)
                hospital_ids.append(hospital.id)
                print(f"Added default Hospital: {hospital_name}")

        department_ids = [d.id for d in db.query(Department).all()]
        if not department_ids:
            for department_name in DEPARTMENTS:
                department = Department(name=department_name, hospital_id=random.choice(hospital_ids))
                db.add(department)
                db.commit()
                db.refresh(department)
                department_ids.append(department.id)
                print(f"Added default Department: {department_name}")

        employee_code = db.query(EmployeeCode).first()
        if not employee_code:
            employee_code = EmployeeCode(code="123456")
            db.add(employee_code)
            db.commit()
            print("Added default Employee Code: 123456")

        ward = db.query(Ward).first()
        if not ward:
            ward = Ward(ward_number="Ward A", department_id=random.choice(department_ids))
            db.add(ward)
            db.commit()
            db.refresh(ward)
            print("Added default Ward: Ward A")

        bed = db.query(Bed).first()
        if not bed:
            bed = Bed(ward_id=ward.id, bed_number="Bed 1")
            db.add(bed)
            db.commit()
            print("Added default Bed: Bed 1")


    except Exception as e:
        print(f"Error initializing default data: {e}")
        db.rollback()
    finally:
        db.close()
