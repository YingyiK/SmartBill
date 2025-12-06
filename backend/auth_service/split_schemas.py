"""
Pydantic schemas for expense split management
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class SplitParticipant(BaseModel):
    """Individual participant in expense split"""
    name: str
    email: Optional[EmailStr] = None
    contact_id: Optional[str] = None
    amount_owed: Decimal
    items_detail: Optional[List[str]] = None  # List of item names


class CreateExpenseSplitRequest(BaseModel):
    """Request to create expense splits"""
    expense_id: str
    participants: List[SplitParticipant]


class ExpenseSplitResponse(BaseModel):
    """Expense split information"""
    id: str
    expense_id: str
    participant_name: str
    participant_email: Optional[str]
    contact_id: Optional[str]
    amount_owed: float
    items_detail: Optional[str]
    is_paid: bool
    email_sent: bool
    email_sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseSplitListResponse(BaseModel):
    """List of expense splits"""
    splits: List[ExpenseSplitResponse]
    total: int


class SendBillRequest(BaseModel):
    """Request to send bills to selected participants"""
    expense_id: str
    participant_ids: List[str]  # List of split IDs to send emails to


class SendBillResponse(BaseModel):
    """Response after sending bills"""
    sent_count: int
    failed_count: int
    results: List[dict]  # List of {participant_id, participant_name, status, message}


