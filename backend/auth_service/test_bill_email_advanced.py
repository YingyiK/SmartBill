#!/usr/bin/env python3
"""
Advanced test for bill/expense email sending with multiple samples
"""
import asyncio
from email_service import send_bill_email

# Sample bills for different scenarios
SAMPLE_BILLS = {
    "1": {
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
    },
    "2": {
        "store_name": "Starbucks Coffee",
        "items": [
            {"name": "Caffe Latte (Grande)", "price": 5.45},
            {"name": "Blueberry Muffin", "price": 3.95},
            {"name": "Croissant", "price": 3.75},
        ],
        "total": 13.15
    },
    "3": {
        "store_name": "Target",
        "items": [
            {"name": "Wireless Mouse", "price": 24.99},
            {"name": "USB-C Cable", "price": 12.99},
            {"name": "Notebooks (3 pack)", "price": 8.99},
            {"name": "Pens Set", "price": 6.49},
            {"name": "Desk Organizer", "price": 15.99},
        ],
        "total": 69.45
    },
    "4": {
        "store_name": "Pizza Palace",
        "items": [
            {"name": "Large Pepperoni Pizza", "price": 18.99},
            {"name": "Caesar Salad", "price": 7.99},
            {"name": "Garlic Bread", "price": 4.99},
            {"name": "Soda (2L)", "price": 2.99},
        ],
        "total": 34.96
    },
    "5": {
        "store_name": "Amazon",
        "items": [
            {"name": "Wireless Headphones", "price": 79.99},
            {"name": "Phone Case", "price": 15.99},
            {"name": "Screen Protector (2 pack)", "price": 9.99},
            {"name": "Charging Dock", "price": 29.99},
        ],
        "total": 135.96
    }
}

def display_samples():
    """Display available sample bills"""
    print("\n" + "="*60)
    print("📋 Available Sample Bills")
    print("="*60)
    
    for key, bill in SAMPLE_BILLS.items():
        items_count = len(bill["items"])
        total = bill["total"]
        store = bill["store_name"]
        print(f"\n{key}. {store}")
        print(f"   Items: {items_count} | Total: ${total:.2f}")
        # Show first 2 items as preview
        for item in bill["items"][:2]:
            print(f"   • {item['name']} - ${item['price']:.2f}")
        if items_count > 2:
            print(f"   • ... and {items_count - 2} more items")

async def test_send_bill():
    """Test sending a bill email"""
    print("\n" + "🧪 SmartBill - Bill Email Test".center(60, "="))
    
    # Get recipient email
    recipient = input("\nEnter your email address: ").strip()
    
    if not recipient:
        print("❌ Email address is required")
        return
    
    # Display available samples
    display_samples()
    
    # Get choice
    print("\n" + "-"*60)
    choice = input("Select a sample bill (1-5) or 'c' for custom: ").strip().lower()
    
    if choice == 'c':
        # Custom bill
        print("\n📝 Create Custom Bill")
        print("-"*60)
        store_name = input("Store name: ").strip() or "Custom Store"
        
        items = []
        print("\nEnter items (press Enter with empty name to finish):")
        while True:
            item_name = input(f"  Item #{len(items)+1} name: ").strip()
            if not item_name:
                break
            try:
                item_price = float(input(f"  Item #{len(items)+1} price: $").strip())
                items.append({"name": item_name, "price": item_price})
            except ValueError:
                print("  ⚠️  Invalid price, skipping item")
        
        if not items:
            print("❌ No items added")
            return
        
        total = sum(item["price"] for item in items)
        bill = {
            "store_name": store_name,
            "items": items,
            "total": total
        }
    elif choice in SAMPLE_BILLS:
        bill = SAMPLE_BILLS[choice]
    else:
        print("❌ Invalid choice")
        return
    
    # Confirm and send
    print("\n" + "="*60)
    print(f"📤 Sending Bill Email")
    print("="*60)
    print(f"   To: {recipient}")
    print(f"   Store: {bill['store_name']}")
    print(f"   Items: {len(bill['items'])} items")
    print(f"   Total: ${bill['total']:.2f}")
    print("\n🔄 Sending email...")
    
    # Send the email
    success = await send_bill_email(recipient, bill)
    
    if success:
        print("\n" + "="*60)
        print("✅ Bill Email Sent Successfully!")
        print("="*60)
        print(f"\n📬 Check your email: {recipient}")
        print(f"   Subject: SmartBill - Your {bill['store_name']} Receipt")
        print("\n💡 What to expect:")
        print("   • Professional email with gradient header")
        print("   • Clean table layout with all items")
        print("   • Highlighted total in green")
        print("   • Mobile-friendly responsive design")
        print("\n🔍 If you don't see it:")
        print("   • Check spam/junk folder")
        print("   • Wait a few seconds for delivery")
        print("   • Verify email address is correct")
    else:
        print("\n" + "="*60)
        print("❌ Failed to Send Bill Email")
        print("="*60)
        print("\n🔍 Troubleshooting:")
        print("   • Check the error messages above")
        print("   • Verify SMTP configuration in .env")
        print("   • Ensure auth_service is running")

async def send_multiple():
    """Send all sample bills"""
    print("\n" + "🚀 Sending All Sample Bills".center(60, "="))
    
    recipient = input("\nEnter your email address: ").strip()
    if not recipient:
        print("❌ Email address is required")
        return
    
    print(f"\n📤 Sending {len(SAMPLE_BILLS)} sample bills to {recipient}...")
    print("-"*60)
    
    success_count = 0
    for key, bill in SAMPLE_BILLS.items():
        print(f"\n[{key}/{len(SAMPLE_BILLS)}] Sending {bill['store_name']}...", end=" ")
        success = await send_bill_email(recipient, bill)
        if success:
            print("✅")
            success_count += 1
        else:
            print("❌")
        await asyncio.sleep(1)  # Small delay between emails
    
    print("\n" + "="*60)
    print(f"✅ Sent {success_count}/{len(SAMPLE_BILLS)} emails successfully!")
    print("="*60)

if __name__ == "__main__":
    try:
        print("\n" + "📧 SmartBill Bill Email Testing Tool".center(60, "="))
        print("\nOptions:")
        print("  1. Send a single sample bill")
        print("  2. Send all sample bills at once")
        
        mode = input("\nSelect mode (1 or 2): ").strip()
        
        if mode == "1":
            asyncio.run(test_send_bill())
        elif mode == "2":
            asyncio.run(send_multiple())
        else:
            print("❌ Invalid choice")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


