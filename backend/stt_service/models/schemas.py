from pydantic import BaseModel

class Participant(BaseModel):
    name: str
    items: list[str]

class ExpenseData(BaseModel):
    transcript: str
    participants: list[Participant]

class TranscriptionResponse(BaseModel):
    text: str