from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
async def process_voice_expense(audio: UploadFile = File(...)):
    """
    Process voice input to extract expense information
    """
    try:
        # Step 1: Transcribe audio
        transcript = await transcription_service.transcribe_audio(audio)
        
        # Step 2: Parse transcript to extract participants
        participants = await expense_parser_service.parse_expense(transcript)
        
        return ExpenseData(
            transcript=transcript,
            participants=participants
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)