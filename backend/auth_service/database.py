"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

# Load from project root .env file
project_root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)  # Load from project root
load_dotenv()  # Also try current directory (for backward compatibility)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://kongyingyi@localhost:5432/smartbill"
)

engine = create_engine(DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)

