from pydantic import BaseModel
from typing import Optional

class Participant(BaseModel):
    name: str
    items: list[str]  # Item names from OCR that this person bought

class ExpenseData(BaseModel):
    transcript: str
    participants: list[Participant]

class TranscriptionResponse(BaseModel):
    text: str