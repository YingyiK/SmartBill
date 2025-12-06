import whisper
import tempfile
import os
from fastapi import UploadFile
from stt_service.config import settings

class TranscriptionService:
    def __init__(self):
        self.model = None
        self.model_name = settings.WHISPER_MODEL
    
    def _load_model(self):
        """Lazy load model to avoid startup delay"""
        if self.model is None:
            print(f"Loading Whisper model: {self.model_name}")
            self.model = whisper.load_model(self.model_name)
            print("Whisper model loaded successfully")
        return self.model
    
    async def transcribe_audio(self, audio_file: UploadFile) -> str:
        """
        Transcribe audio file to text using Whisper
        """
        # Save uploaded file temporarily
        temp_path = None
        try:
            # Get file extension from content type or filename
            suffix = ".webm"
            if audio_file.filename:
                _, ext = os.path.splitext(audio_file.filename)
                if ext:
                    suffix = ext
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                content = await audio_file.read()
                temp_file.write(content)
                temp_path = temp_file.name
            
            # Load model if not already loaded
            model = self._load_model()
            
            # Transcribe
            print(f"Transcribing audio file: {temp_path}")
            result = model.transcribe(temp_path)
            transcript = result.get("text", "").strip()
            print(f"Transcription result: {transcript[:100]}...")
            return transcript
        except Exception as e:
            print(f"Transcription error: {e}")
            raise
        finally:
            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass

# Singleton instance
transcription_service = TranscriptionService()