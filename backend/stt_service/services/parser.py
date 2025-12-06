from openai import OpenAI
import json
from typing import Optional
from config import settings
from models.schemas import Participant

class ExpenseParserService:
    
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    SYSTEM_PROMPT = """Extract expense information from the text. 
    Return JSON with format:
    {
        "participants": [
            {"name": "person_name", "items": ["exact_item_name_from_ocr"]},
            ...
        ]
    }
    Normalize names to lowercase.
    IMPORTANT: For "items", use the EXACT item names from the OCR list provided. Match the spoken items to the OCR items by meaning/similarity."""
    
    async def parse_expense(self, transcript: str, group_members: Optional[list] = None, ocr_items: Optional[list] = None, current_user_name: Optional[str] = None) -> list[Participant]:
        """
        Parse transcript to extract participants and their items using GPT
        group_members: Optional list of participant names from selected group to help AI understand context
        """
        if not self.client:
            # If no OpenAI API key, return empty participants
            print("Warning: OPENAI_API_KEY not set, returning empty participants")
            return []
        
        try:
            # Build enhanced prompt
            system_prompt = self.SYSTEM_PROMPT
            user_content = transcript
            
            # Add OCR items list to prompt if provided
            if ocr_items and len(ocr_items) > 0:
                items_list = "\n".join([f"- {item.get('name', item) if isinstance(item, dict) else item}" for item in ocr_items])
                system_prompt += f"\n\nAvailable items from receipt (use EXACT names from this list):\n{items_list}\n\nMatch the items mentioned in the transcript to the EXACT item names from the list above. Only use item names that exist in the list."
            
            # Add current user context (for "I" mapping)
            if current_user_name:
                system_prompt += f"\n\nIMPORTANT: When the transcript mentions 'I', 'me', 'my', or 'myself', it refers to the current user: '{current_user_name}'. Map these references to '{current_user_name}' in the participants list."
            
            # Add group members context if provided
            if group_members and len(group_members) > 0:
                members_list = ", ".join(group_members)
                system_prompt += f"\n\nThe following people are part of this expense group: {members_list}. Use these names when extracting participants from the transcript."
            
            # Print prompt for debugging
            print(f"=== GPT Prompt Debug ===")
            print(f"System Prompt:\n{system_prompt}")
            print(f"User Content: {user_content}")
            print(f"OCR Items: {ocr_items}")
            print(f"Group Members: {group_members}")
            
            # Add explicit JSON format instruction to prompt
            system_prompt += "\n\nIMPORTANT: You must return ONLY valid JSON. Do not include any text, markdown formatting, or explanations before or after the JSON. The response must be parseable JSON only."
            user_content_with_format = user_content + "\n\nReturn the JSON response now:"
            
            completion = self.client.chat.completions.create(
                model=settings.GPT_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_content_with_format
                    }
                ]
                # Removed response_format - not all models support it, using prompt instruction instead
            )
            
            # Print raw response
            raw_response = completion.choices[0].message.content
            print(f"=== GPT Raw Response ===")
            print(f"Raw JSON: {raw_response}")
            
            parsed_data = json.loads(raw_response)
            print(f"=== Parsed Data ===")
            print(f"Parsed: {parsed_data}")
            
            # Convert to Pydantic models
            participants_raw = parsed_data.get("participants", [])
            print(f"=== Participants Raw ===")
            print(f"Participants list: {participants_raw}")
            print(f"Participants count: {len(participants_raw)}")
            
            participants = []
            for idx, participant in enumerate(participants_raw):
                try:
                    participant_obj = Participant(**participant)
                    participants.append(participant_obj)
                    print(f"Participant {idx}: {participant_obj.name} -> {participant_obj.items}")
                except Exception as e:
                    print(f"Error creating Participant {idx}: {e}, data: {participant}")
            
            print(f"=== Final Participants ===")
            print(f"Total participants: {len(participants)}")
            for p in participants:
                print(f"  - {p.name}: {p.items}")
            
            return participants
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Raw response was: {completion.choices[0].message.content if 'completion' in locals() else 'N/A'}")
            return []
        except Exception as e:
            import traceback
            print(f"Error parsing expense: {e}")
            traceback.print_exc()
            # Return empty list on error
            return []

# Singleton instance
expense_parser_service = ExpenseParserService()