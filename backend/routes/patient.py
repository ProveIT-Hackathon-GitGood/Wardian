from typing import Annotated, List

from fastapi import APIRouter, Depends, status, File, UploadFile
import os
import shutil
from datetime import datetime
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from schemas.patient import PatientCreateSchema, PatientUpdateSchema, PatientResponseSchema, PatientHistoryCreateSchema, PatientHistoryResponse
from services.patient import PatientService

db_dependency = Annotated[Session, Depends(get_db)]

patient_service = PatientService()

patient_router = APIRouter(prefix="/api/v1/patient", tags=["patient"])

UPLOAD_DIR = "/app/static_uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)



@patient_router.get("/", response_model=List[PatientResponseSchema])
def get_patients(db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.get_patients(db)


@patient_router.get("/{patient_id}", response_model=PatientResponseSchema)
def get_patient(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.get_patient(db, patient_id)

@patient_router.post("/upload")
async def upload_patient_file(file: UploadFile = File(...), user_data=Depends(get_current_user)):
    try:
        # Generate a unique filename: timestamp_originalfilename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "filename": file.filename,
            "url": f"/uploads/{safe_filename}"
        }
    except Exception as e:
        print(f"Error uploading file: {e}")
        return {"error": str(e)}, 500

@patient_router.post("/", response_model=PatientResponseSchema, status_code=status.HTTP_201_CREATED)
def create_patient(request: PatientCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.create_patient(db, request)

@patient_router.post("/{patient_id}/history", response_model=PatientHistoryResponse, status_code=status.HTTP_201_CREATED)
def add_patient_history(patient_id: int, request: PatientHistoryCreateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.add_patient_history(db, patient_id, request)

@patient_router.patch("/{patient_id}", response_model=PatientResponseSchema)
def update_patient(patient_id: int, request: PatientUpdateSchema, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.update_patient(db, patient_id, request)
@patient_router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(patient_id: int, db: db_dependency, user_data=Depends(get_current_user)):
    return patient_service.delete_patient(db, patient_id)
