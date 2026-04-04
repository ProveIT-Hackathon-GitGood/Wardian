from fastapi import FastAPI
import models.bed as bed_model
import models.department as department_model
import models.hospital as hospital_model
import models.ward as ward_model
import models.patient as patient_model
import models.medical_staff as medical_staff_model

from database import engine

app = FastAPI()

bed_model.Base.metadata.create_all(bind=engine)
department_model.Base.metadata.create_all(bind=engine)
hospital_model.Base.metadata.create_all(bind=engine)
patient_model.Base.metadata.create_all(bind=engine)
medical_staff_model.Base.metadata.create_all(bind=engine)
ward_model.Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
