from openai import OpenAI
import json
from typing import Optional
from ..config import settings
from ..models.schemas import Participant

class ExpenseParserService:
    
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    SYSTEM_PROMPT = """Extract expense information from the text. 
    Return JSON with format:
    {
        "participants": [
            {"name": "person_name", "items": ["item1", "item2"]},
            ...
        ]
    }
    Normalize names to lowercase."""
    
    async def parse_expense(self, transcript: str, receipt:str, group_members: Optional[list] = None) -> list[Participant]:
        """
        Parse transcript to extract participants and their items using GPT
        group_members: Optional list of participant names from selected group to help AI understand context
        """
        if not self.client:
            # If no OpenAI API key, return empty participants
            print("Warning: OPENAI_API_KEY not set, returning empty participants")
            return []
        
        try:
            # Build enhanced prompt if group members are provided
            system_prompt = self.SYSTEM_PROMPT
            user_content = f"""
            You are an expert in arrangement of shared expenses.
            According to the receipt, which contains the items purchased. 
            First, analyze the receipt to identify items purchased, there may be some items only shown in brand name.
            You need to infer the actual item name based on common knowledge.
            Then, analyze the transcript of a conversation among participants about who ordered which items.
            Finally, map each participant to the items they ordered.
            Transcript: {transcript}
            Receipt: {receipt}
            Extract the participants and their items as per the system prompt.
            """
            
            if group_members and len(group_members) > 0:
                members_list = ", ".join(group_members)
                system_prompt += f"\n\nNote: The following people are part of this expense group: {members_list}. Use these names when extracting participants from the transcript."
            
            completion = self.client.chat.completions.create(
                model=settings.GPT_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_content
                    }
                ]
            )
            
            parsed_data = json.loads(completion.choices[0].message.content)
            
            # Convert to Pydantic models
            participants = [
                Participant(**participant) 
                for participant in parsed_data.get("participants", [])
            ]
            
            return participants
        except Exception as e:
            print(f"Error parsing expense: {e}")
            # Return empty list on error
            return []

# Singleton instance
expense_parser_service = ExpenseParserService()