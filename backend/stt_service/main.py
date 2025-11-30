from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
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
    group_members: Optional[List[str]] = Body(None, description="List of group member names")
):
    """
    Process voice input to extract expense information
    group_members: Optional list of participant names from selected group
    """
    try:
        print(f"Received audio file: {audio.filename}, content_type: {audio.content_type}")
        if group_members:
            print(f"Group members provided: {group_members}")
        
        # Step 1: Transcribe audio
        transcript = await transcription_service.transcribe_audio(audio)
        
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript generated from audio")
        
        # Step 2: Parse transcript to extract participants
        # Pass group_members to help AI understand context
        participants = await expense_parser_service.parse_expense(transcript, group_members=group_members)
        
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