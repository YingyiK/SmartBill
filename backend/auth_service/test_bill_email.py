#!/usr/bin/env python3
"""
Test bill/expense email sending
"""
import asyncio
from email_service import send_bill_email

# Sample bill data
sample_bill = {
    "store_name": "Whole Foods Market",
    "items": [
        {"name": "Organic Bananas", "price": 3.99},
        {"name": "Greek Yogurt", "price": 5.49},
        {"name": "Avocados (3 pack)", "price": 6.99},
        {"name": "Sourdough Bread", "price": 4.99},
        {"name": "Almond Milk", "price": 3.79},
        {"name": "Fresh Salmon", "price": 12.99},
        {"name": "Mixed Salad", "price": 4.49},
    ],
    "total": 42.73
}

async def test_send_bill():
    """Test sending a bill email"""
    print("\n" + "="*60)
    print("📧 Testing Bill Email Service")
    print("="*60)
    
    # Get recipient email
    recipient = input("\nEnter your email address: ").strip()
    
    if not recipient:
        print("❌ Email address is required")
        return
    
    print(f"\n📤 Sending bill email to: {recipient}")
    print(f"   Store: {sample_bill['store_name']}")
    print(f"   Items: {len(sample_bill['items'])} items")
    print(f"   Total: ${sample_bill['total']:.2f}")
    print("\nSending...")
    
    # Send the email
    success = await send_bill_email(recipient, sample_bill)
    
    if success:
        print("\n" + "="*60)
        print("✅ Bill email sent successfully!")
        print("="*60)
        print("\n📬 Check your email inbox!")
        print("   Subject: SmartBill - Your Whole Foods Market Receipt")
        print("\n💡 Tips:")
        print("   • Check spam folder if not in inbox")
        print("   • Email should look professional with tables")
        print("   • Should be mobile-friendly")
    else:
        print("\n" + "="*60)
        print("❌ Failed to send bill email")
        print("="*60)
        print("\n🔍 Troubleshooting:")
        print("   • Check SMTP configuration in .env")
        print("   • Check error messages above")
        print("   • Ensure auth_service is configured properly")

if __name__ == "__main__":
    try:
        asyncio.run(test_send_bill())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


