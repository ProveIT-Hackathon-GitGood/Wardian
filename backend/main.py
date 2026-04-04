from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

import models.bed as bed_model
import models.department as department_model
import models.hospital as hospital_model
import models.ward as ward_model
import models.patient as patient_model
import models.medical_staff as medical_staff_model

from database import engine
from exceptions.handlers import register_exception_handlers
from routes.auth import auth_router
from routes.bed import bed_router
from routes.department import department_router
from routes.hospital import hospital_router
from routes.medical_staff import medical_staff_router
from routes.patient import patient_router
from routes.ward import ward_router

app = FastAPI()

origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(bed_router)
app.include_router(department_router)
app.include_router(hospital_router)
app.include_router(medical_staff_router)
app.include_router(patient_router)
app.include_router(ward_router)
app.include_router(auth_router)

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
