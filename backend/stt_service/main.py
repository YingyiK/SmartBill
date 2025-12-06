from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import json
from models.schemas import ExpenseData
from services.transcription import transcription_service
from services.parser import expense_parser_service

app = FastAPI(title="Splitwise Voice Expense API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-voice-expense", response_model=ExpenseData)
async def process_voice_expense(
    audio: UploadFile = File(...),
    group_members: Optional[str] = Form(None, description="JSON string array of group member names"),
    ocr_items: Optional[str] = Form(None, description="JSON string array of OCR items from receipt"),
    current_user_name: Optional[str] = Form(None, description="Current user's name/email username for 'I' mapping")
):
    """
    Process voice input to extract expense information
    group_members: Optional list of participant names from selected group
    ocr_items: Optional list of items from OCR result to match against
    """
    try:
        print(f"Received audio file: {audio.filename}, content_type: {audio.content_type}")
        
        # Parse group_members from JSON string
        members_list = None
        if group_members:
            try:
                members_list = json.loads(group_members)
                if not isinstance(members_list, list):
                    if isinstance(members_list, str):
                        members_list = [members_list]
                    else:
                        print(f"Warning: group_members is not a list: {type(members_list)}")
                        members_list = None
                print(f"Group members provided: {members_list}")
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Warning: Could not parse group_members as JSON: {e}")
                members_list = [group_members] if group_members else None
        
        # Parse ocr_items from JSON string
        items_list = None
        if ocr_items:
            try:
                items_list = json.loads(ocr_items)
                if not isinstance(items_list, list):
                    print(f"Warning: ocr_items is not a list: {type(items_list)}")
                    items_list = None
                else:
                    print(f"OCR items provided: {len(items_list)} items")
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Warning: Could not parse ocr_items as JSON: {e}")
                items_list = None
        
        # Step 1: Transcribe audio
        transcript = await transcription_service.transcribe_audio(audio)
        
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript generated from audio")
        
        # Step 2: Parse transcript to extract participants
        # Pass group_members, ocr_items, and current_user_name to help AI understand context and match items
        participants = await expense_parser_service.parse_expense(
            transcript, 
            group_members=members_list,
            ocr_items=items_list,
            current_user_name=current_user_name
        )
        
        return ExpenseData(
            transcript=transcript,
            participants=participants
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing voice: {error_detail}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)