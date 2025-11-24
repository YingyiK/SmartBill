from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    WHISPER_MODEL = "base"  # or "small", "medium", "large"
    GPT_MODEL = "gpt-4"
    
settings = Settings()