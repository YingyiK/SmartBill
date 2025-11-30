from dotenv import load_dotenv
import os

# Load from project root .env file
project_root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)  # Load from project root
load_dotenv()  # Also try current directory (for backward compatibility)

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # or "small", "medium", "large"
    GPT_MODEL = os.getenv("GPT_MODEL", "gpt-4")
    
settings = Settings()