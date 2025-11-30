"""
Pydantic schemas for Group API
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class GroupMemberSchema(BaseModel):
    name: str
    email: Optional[str] = None


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    members: List[GroupMemberSchema] = []


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    members: Optional[List[GroupMemberSchema]] = None


class GroupResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    members: List[GroupMemberSchema] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GroupListResponse(BaseModel):
    groups: List[GroupResponse]
    total: int

