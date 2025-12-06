#!/usr/bin/env python3
"""
Clean up test data from database
"""
from database import SessionLocal
from models import User, EmailVerificationCode, Expense, ExpenseSplit, Contact

def main():
    print("\n" + "="*60)
    print("🗑️  SmartBill Database Cleanup")
    print("="*60)
    
    db = SessionLocal()
    
    # Show current data
    users = db.query(User).all()
    print(f"\nCurrent users: {len(users)}")
    for user in users:
        print(f"   • {user.email}")
    
    print("\n" + "-"*60)
    print("⚠️  WARNING: This will delete data from the database!")
    print("-"*60)
    print("\nOptions:")
    print("  1. Delete specific user by email")
    print("  2. Delete all test users (emails containing 'test')")
    print("  3. Delete ALL users (⚠️  DANGEROUS!)")
    print("  4. Cancel")
    
    choice = input("\nSelect option (1-4): ").strip()
    
    if choice == "1":
        email = input("Enter email to delete: ").strip().lower()
        user = db.query(User).filter(User.email == email).first()
        if user:
            confirm = input(f"Delete {email}? (yes/no): ").strip().lower()
            if confirm == "yes":
                db.delete(user)
                db.commit()
                print(f"✅ Deleted {email}")
            else:
                print("❌ Cancelled")
        else:
            print(f"❌ User {email} not found")
    
    elif choice == "2":
        test_users = db.query(User).filter(User.email.like('%test%')).all()
        print(f"\nFound {len(test_users)} test users:")
        for user in test_users:
            print(f"   • {user.email}")
        
        if test_users:
            confirm = input(f"\nDelete all {len(test_users)} test users? (yes/no): ").strip().lower()
            if confirm == "yes":
                for user in test_users:
                    db.delete(user)
                db.commit()
                print(f"✅ Deleted {len(test_users)} test users")
            else:
                print("❌ Cancelled")
        else:
            print("No test users found")
    
    elif choice == "3":
        confirm = input("⚠️  Delete ALL users? Type 'DELETE ALL' to confirm: ").strip()
        if confirm == "DELETE ALL":
            count = len(users)
            for user in users:
                db.delete(user)
            db.commit()
            print(f"✅ Deleted all {count} users")
        else:
            print("❌ Cancelled")
    
    else:
        print("❌ Cancelled")
    
    # Show remaining data
    remaining_users = db.query(User).all()
    print(f"\n📊 Remaining users: {len(remaining_users)}")
    for user in remaining_users:
        print(f"   • {user.email}")
    
    print("="*60 + "\n")
    db.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


