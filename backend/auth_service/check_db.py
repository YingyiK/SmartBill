#!/usr/bin/env python3
"""
Check database contents and statistics
"""
from database import SessionLocal
from models import User, EmailVerificationCode, Expense, ExpenseSplit, Contact
from datetime import datetime

def main():
    db = SessionLocal()
    
    print("\n" + "="*60)
    print("📊 SmartBill Database Status")
    print("="*60)
    
    # Users
    users = db.query(User).all()
    print(f"\n👥 Users: {len(users)}")
    for user in users:
        print(f"   • {user.email}")
        print(f"     Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"     Verified: {'✅' if user.email_verified else '❌'}")
    
    # Verification codes
    codes = db.query(EmailVerificationCode).order_by(EmailVerificationCode.created_at.desc()).limit(10).all()
    print(f"\n📧 Recent Verification Codes (last 10): {len(codes)}")
    for code in codes:
        status = "✅ Used" if code.used else "⏳ Unused"
        expired = code.expires_at < datetime.utcnow()
        if not code.used and expired:
            status = "⏰ Expired"
        print(f"   • {code.email}: {code.code} - {status}")
    
    # Contacts
    contacts = db.query(Contact).all()
    print(f"\n🤝 Contacts: {len(contacts)}")
    if contacts:
        for contact in contacts:
            owner = db.query(User).filter(User.id == contact.user_id).first()
            friend = db.query(User).filter(User.id == contact.friend_user_id).first()
            if owner and friend:
                nickname = f" ({contact.nickname})" if contact.nickname else ""
                print(f"   • {owner.email} → {friend.email}{nickname}")
    
    # Expenses
    expenses = db.query(Expense).all()
    print(f"\n💰 Expenses: {len(expenses)}")
    for expense in expenses:
        owner = db.query(User).filter(User.id == expense.user_id).first()
        if owner:
            print(f"   • {expense.store_name}: ${expense.total_amount}")
            print(f"     By: {owner.email}")
            print(f"     Created: {expense.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Splits
    splits = db.query(ExpenseSplit).all()
    print(f"\n✂️  Expense Splits: {len(splits)}")
    for split in splits:
        status = "✅ Paid" if split.is_paid else "⏳ Pending"
        email_status = "📧 Sent" if split.email_sent else "📭 Not sent"
        print(f"   • {split.participant_name}: ${split.amount_owed} - {status} {email_status}")
    
    print("\n" + "="*60)
    print("Summary:")
    print(f"  Total Users: {len(users)}")
    print(f"  Total Contacts: {len(contacts)}")
    print(f"  Total Expenses: {len(expenses)}")
    print(f"  Total Splits: {len(splits)}")
    print("="*60 + "\n")
    
    db.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


