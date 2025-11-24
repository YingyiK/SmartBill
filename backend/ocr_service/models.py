"""
Data models for OCR service
Defines the structure of API requests and responses
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class Item(BaseModel):
    """
    Represents a single item from a receipt
    """
    name: str = Field(..., description="Item name extracted from receipt")
    price: float = Field(..., description="Item price in dollars")
    quantity: Optional[int] = Field(1, description="Quantity of items")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Organic Steak",
                "price": 25.99,
                "quantity": 1
            }
        }

class OCRResponse(BaseModel):
    """
    Response model for OCR processing
    """
    success: bool = Field(..., description="Whether OCR processing succeeded")
    raw_text: str = Field(..., description="Raw text extracted by OCR")
    items: List[Item] = Field(..., description="Parsed items with prices")
    total: Optional[float] = Field(None, description="Total amount if detected")
    subtotal: Optional[float] = Field(None, description="Subtotal amount if detected")
    tax_amount: Optional[float] = Field(None, description="Tax amount if detected")
    tax_rate: Optional[float] = Field(None, description="Tax rate used for calculation")
    store_name: Optional[str] = Field(None, description="Store name if detected")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "raw_text": "COSTCO\nSteak $25.99\nPasta $8.50\n...",
                "items": [
                    {"name": "Steak", "price": 25.99, "quantity": 1},
                    {"name": "Pasta", "price": 8.50, "quantity": 1}
                ],
                "total": 34.49,
                "subtotal": 34.49,
                "tax_amount": 2.76,
                "tax_rate": 0.08,
                "store_name": "COSTCO"
            }
        }

class ErrorResponse(BaseModel):
    """
    Error response model
    """
    success: bool = False
    error: str = Field(..., description="Error message")