"""
Initialize database tables
Run this script to create all database tables
"""
from database import engine, init_db
from models import Base

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("✅ Database tables created successfully!")

