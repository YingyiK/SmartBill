"""
Pydantic schemas for contact management
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AddContactRequest(BaseModel):
    """Request to add a friend by email"""
    friend_email: EmailStr
    nickname: Optional[str] = None


class UpdateContactRequest(BaseModel):
    """Request to update a contact's nickname"""
    friend_email: Optional[EmailStr] = None  # Not required for update
    nickname: Optional[str] = None


class ContactResponse(BaseModel):
    """Contact information"""
    id: str
    user_id: str
    friend_user_id: str
    friend_email: str
    nickname: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    """List of contacts"""
    contacts: list[ContactResponse]
    total: int


