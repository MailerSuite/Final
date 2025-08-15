from pydantic import BaseModel, EmailStr, Field
import re


class LoginRequest(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=1)


class RegisterRequest:  # not a BaseModel on purpose (unit test expects ValueError)
    def __init__(self, email: str, password: str, confirm_password: str):
        # Minimal email validation to mirror expectations in tests
        email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Invalid email")
        if len(password) < 8 or len(confirm_password) < 8:
            raise ValueError("Password too short")
        if password != confirm_password:
            raise ValueError("Passwords do not match")
        self.email = email
        self.password = password
        self.confirm_password = confirm_password