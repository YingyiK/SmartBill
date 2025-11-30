"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    verification_code: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v


class SendVerificationCodeRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr
    verification_code: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v


class MessageResponse(BaseModel):
    message: str

