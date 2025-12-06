"""
Pydantic schemas for Contact Group API
"""
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class ContactGroupMemberSchema(BaseModel):
    contact_id: Optional[UUID] = None  # None if this is the creator (user themselves)
    user_id: Optional[UUID] = None  # Set if this is the creator (user themselves)
    contact_email: str
    contact_nickname: Optional[str] = None
    is_creator: bool = False  # True if this member is the group creator


class CreateContactGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    contact_ids: List[UUID] = []


class UpdateContactGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_ids: Optional[List[UUID]] = None


class ContactGroupResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    members: List[ContactGroupMemberSchema] = []
    member_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactGroupListResponse(BaseModel):
    groups: List[ContactGroupResponse]
    total: int

