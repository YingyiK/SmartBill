import openai
import json
from config import settings
from models.schemas import Participant

openai.api_key = settings.OPENAI_API_KEY

class ExpenseParserService:
    
    SYSTEM_PROMPT = """Extract expense information from the text. 
    Return JSON with format:
    {
        "participants": [
            {"name": "person_name", "items": ["item1", "item2"]},
            ...
        ]
    }
    Normalize names to lowercase."""
    
    async def parse_expense(self, transcript: str) -> list[Participant]:
        """
        Parse transcript to extract participants and their items using GPT
        """
        completion = openai.chat.completions.create(
            model=settings.GPT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": self.SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": transcript
                }
            ],
            response_format={"type": "json_object"}
        )
        
        parsed_data = json.loads(completion.choices[0].message.content)
        
        # Convert to Pydantic models
        participants = [
            Participant(**participant) 
            for participant in parsed_data["participants"]
        ]
        
        return participants

# Singleton instance
expense_parser_service = ExpenseParserService()