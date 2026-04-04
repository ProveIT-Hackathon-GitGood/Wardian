from sqlalchemy.orm import Session
from models.patient import Patient, PatientHistory
from schemas.patient import PatientCreateSchema, PatientUpdateSchema, PatientHistoryCreateSchema

class PatientRepository:
    def get_patients(self, db: Session):
        return db.query(Patient).all()

    def get_patient(self, db: Session, patient_id: int):
        return db.query(Patient).filter(Patient.id == patient_id).first()

    def add_patient_history(self, db: Session, patient_id: int, history_data: PatientHistoryCreateSchema):
        db_history = PatientHistory(**history_data.model_dump(), patient_id=patient_id)
        db.add(db_history)
        db.commit()
        db.refresh(db_history)
        return db_history
    def create_patient(self, db: Session, patient_data: PatientCreateSchema):
        db_patient = Patient(**patient_data.model_dump())
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient

    def update_patient(self, db: Session, patient_id: int, patient_data: PatientUpdateSchema):
        db_patient = self.get_patient(db, patient_id)
        if not db_patient:
            return None
        
        update_data = patient_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_patient, key, value)
            
        db.commit()
        db.refresh(db_patient)
        return db_patient

    def delete_patient(self, db: Session, patient_id: int):
        db_patient = self.get_patient(db, patient_id)
        if not db_patient:
            return False
            
        db.delete(db_patient)
        db.commit()
        return True
