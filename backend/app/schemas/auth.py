from pydantic import BaseModel, EmailStr
from typing import Any


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    resume_data: Any | None = None
    jd_data: Any | None = None


class ProfileOut(BaseModel):
    resume_data: Any | None = None
    jd_data: Any | None = None
    user: UserOut
