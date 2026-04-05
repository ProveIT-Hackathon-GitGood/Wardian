from sqlalchemy.orm import configure_mappers
from database import SessionLocal
from models.patient import Patient, PatientHistory, PatientVital
from models.bed import Bed
from models.ward import Ward
from models.department import Department
from schemas.patient import PatientResponseSchema

configure_mappers()

def test_fetch():
    db = SessionLocal()
    try:
        patients = db.query(Patient).all()
        for p in patients:
            resp = PatientResponseSchema.model_validate(p)
            print(f"Patient {p.id}: {p.name}")
            print(f"History count: {len(resp.medical_history)}")
            for h in resp.medical_history:
                print(f" - {h.title} ({h.type})")
    finally:
        db.close()

if __name__ == "__main__":
    test_fetch()
