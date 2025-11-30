"""
Pydantic schemas for expense API
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ExpenseItemSchema(BaseModel):
    name: str
    price: float
    quantity: Optional[int] = 1


class ExpenseParticipantSchema(BaseModel):
    name: str
    items: Optional[List[str]] = []


class CreateExpenseRequest(BaseModel):
    store_name: Optional[str] = None
    total_amount: float
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_rate: Optional[float] = None
    raw_text: Optional[str] = None
    transcript: Optional[str] = None
    items: List[ExpenseItemSchema] = []
    participants: List[ExpenseParticipantSchema] = []


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    store_name: Optional[str]
    total_amount: float
    subtotal: Optional[float]
    tax_amount: Optional[float]
    tax_rate: Optional[float]
    raw_text: Optional[str]
    transcript: Optional[str]
    items: List[ExpenseItemSchema] = []
    participants: List[ExpenseParticipantSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total: int

