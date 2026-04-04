import re

from pydantic import BaseModel, EmailStr, SecretStr, Field, field_validator, ConfigDict

from models.medical_staff import StaffRole


class CreateUserSchema(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "full_name": "fullname",
                "email": "student123@yahoo.com",
                "password": "Password1@",
                "hospital_id": 1,
                "department_id": 2,
                "role": "doctor",
            }]
        }
    )

    full_name: str = Field(default=None)
    email: EmailStr
    password: SecretStr
    hospital_id: int
    department_id: int
    role: StaffRole

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: SecretStr):
        password = v.get_secret_value()
        pattern = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(pattern, password):
            raise ValueError(
                "Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character."
            )
        return v


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: SecretStr


class UserLoginOut(BaseModel):
    token: str

    class Config:
        from_attributes = True
