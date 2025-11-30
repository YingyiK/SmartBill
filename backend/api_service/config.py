"""
Configuration for API Gateway Service
"""
import os
from dotenv import load_dotenv

# Load from project root .env file
project_root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)  # Load from project root
load_dotenv()  # Also try current directory (for backward compatibility)

# Service URLs
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:6000")
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8000")
STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://localhost:8001")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8002")

# JWT settings (must match auth_service)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

