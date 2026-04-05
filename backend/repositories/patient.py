from sqlalchemy.orm import Session
from models.patient import Patient, PatientHistory, PatientVital
from schemas.patient import PatientCreateSchema, PatientUpdateSchema, PatientHistoryCreateSchema, PatientVitalCreateSchema, PatientVitalUpdateSchema

class PatientRepository:
    def get_patients(self, db: Session):
        return db.query(Patient).all()

    def get_patient(self, db: Session, patient_id: int):
        return db.query(Patient).filter(Patient.id == patient_id).first()

    def get_patients(self, db: Session):
        return db.query(Patient).all()

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


class PatientVitalRepository:
    def get_patient_vitals(self, db: Session, patient_id: int):
        return db.query(PatientVital).filter(PatientVital.patient_id == patient_id).all()

    def get_patient_vital(self, db: Session, patient_id: int, vital_id: int):
        return db.query(PatientVital).filter(PatientVital.patient_id == patient_id, PatientVital.id == vital_id).first()

    def create_patient_vital(self, db: Session, patient_id: int, vital_data: PatientVitalCreateSchema):
        db_vital = PatientVital(**vital_data.model_dump(), patient_id=patient_id)
        db.add(db_vital)
        db.commit()
        db.refresh(db_vital)
        return db_vital

    def update_patient_vital(self, db: Session, patient_id: int, vital_id: int, vital_data: PatientVitalUpdateSchema):
        db_vital = self.get_patient_vital(db, patient_id, vital_id)
        if not db_vital:
            return None
        
        update_data = vital_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vital, key, value)
            
        db.commit()
        db.refresh(db_vital)
        return db_vital

    def delete_patient_vital(self, db: Session, patient_id: int, vital_id: int):
        db_vital = self.get_patient_vital(db, patient_id, vital_id)
        if not db_vital:
            return False
            
        db.delete(db_vital)
        db.commit()
        return True
