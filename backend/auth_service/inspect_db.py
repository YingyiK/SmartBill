import sys
import os
from sqlalchemy import inspect

# Add the current directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import User, EmailVerificationCode, Expense, ExpenseItem, ExpenseParticipant, Contact, ContactGroup, ExpenseSplit

def inspect_db():
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        print(f"Found tables: {table_names}")
        print("-" * 50)

        models = [
            User, 
            EmailVerificationCode, 
            Expense, 
            ExpenseItem, 
            ExpenseParticipant,
            Contact,
            ContactGroup,
            ExpenseSplit
        ]

        for model in models:
            table_name = model.__tablename__
            if table_name in table_names:
                print(f"\nTable: {table_name}")
                records = db.query(model).all()
                print(f"Count: {len(records)}")
                if records:
                    print("Data:")
                    for record in records:
                        # simple dict representation
                        data = {c.name: getattr(record, c.name) for c in model.__table__.columns}
                        print(data)
                else:
                    print("No data.")
                print("-" * 50)
            else:
                print(f"Table {table_name} not found in database.")

    except Exception as e:
        print(f"Error inspecting database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_db()
