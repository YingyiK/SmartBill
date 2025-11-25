import whisper
import tempfile
import os
from fastapi import UploadFile
from config import settings

class TranscriptionService:
    def __init__(self):
        self.model = whisper.load_model(settings.WHISPER_MODEL)
    
    async def transcribe_audio(self, audio_file: UploadFile) -> str:
        """
        Transcribe audio file to text using Whisper
        """
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Transcribe
            result = self.model.transcribe(temp_path)
            return result["text"]
        finally:
            # Clean up temp file
            os.unlink(temp_path)

# Singleton instance
transcription_service = TranscriptionService()