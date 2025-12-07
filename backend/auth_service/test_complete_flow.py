#!/usr/bin/env python3
"""
Complete end-to-end test for SmartBill expense splitting system
Tests:
1. Register two users
2. Add each other as friends (auto bidirectional)
3. User A creates expense
4. User A creates splits
5. User A sends bills to User B
6. User B views shared expenses
"""
import requests
import time
from typing import Optional, Dict

# Configuration
BASE_URL = "http://localhost:6000"

# Test users
USER_A_EMAIL = "alice@test.com"
USER_A_PASSWORD = "test123456"

USER_B_EMAIL = "bob@test.com"
USER_B_PASSWORD = "test123456"

# Colors
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'

def print_section(title):
    print("\n" + "="*70)
    print(f"{Colors.CYAN}{title}{Colors.NC}")
    print("="*70)

def print_step(step_num, description):
    print(f"\n{Colors.BLUE}[Step {step_num}]{Colors.NC} {description}")

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.NC}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.NC}")

def print_info(msg):
    print(f"{Colors.YELLOW}ℹ️  {msg}{Colors.NC}")

def print_data(label, data):
    print(f"{Colors.PURPLE}{label}:{Colors.NC} {data}")


class SmartBillTester:
    def __init__(self):
        self.user_a_token = None
        self.user_b_token = None
        self.user_a_id = None
        self.user_b_id = None
        self.contact_id = None
        self.expense_id = None
        self.split_ids = []
        
    def register_user(self, email: str, password: str) -> Optional[str]:
        """Register a user and return their token"""
        print(f"   Registering {email}...")
        
        # Send verification code
        response = requests.post(
            f"{BASE_URL}/send-verification-code",
            json={"email": email}
        )
        
        if response.status_code != 200:
            print_error(f"Failed to send verification code: {response.text}")
            return None
        
        print_info("Verification code sent. Check terminal running auth_service (port 6000)")
        
        # Get verification code from user
        code = input(f"   Enter verification code for {email}: ").strip()
        
        # Register
        response = requests.post(
            f"{BASE_URL}/register",
            json={
                "email": email,
                "password": password,
                "verification_code": code
            }
        )
        
        if response.status_code != 200:
            print_error(f"Registration failed: {response.text}")
            return None
        
        data = response.json()
        print_success(f"Registered {email}")
        return data.get("access_token")
    
    def add_contact(self, token: str, friend_email: str, nickname: str = None) -> Optional[str]:
        """Add a friend to contacts"""
        response = requests.post(
            f"{BASE_URL}/contacts",
            headers={"Authorization": f"Bearer {token}"},
            json={"friend_email": friend_email, "nickname": nickname}
        )
        
        if response.status_code != 200:
            print_error(f"Failed to add contact: {response.text}")
            return None
        
        data = response.json()
        contact_id = data.get("id")
        print_success(f"Added {friend_email} to contacts (auto bidirectional)")
        return contact_id
    
    def get_contacts(self, token: str) -> list:
        """Get user's contacts"""
        response = requests.get(
            f"{BASE_URL}/contacts",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            print_error(f"Failed to get contacts: {response.text}")
            return []
        
        data = response.json()
        return data.get("contacts", [])
    
    def create_expense(self, token: str) -> Optional[str]:
        """Create a test expense"""
        expense_data = {
            "store_name": "Pizza Palace",
            "total_amount": 50.00,
            "subtotal": 45.00,
            "tax_amount": 5.00,
            "items": [
                {"name": "Large Pepperoni Pizza", "price": 25.00, "quantity": 1},
                {"name": "Caesar Salad", "price": 10.00, "quantity": 1},
                {"name": "Garlic Bread", "price": 5.00, "quantity": 1},
                {"name": "Soda", "price": 3.00, "quantity": 2},
                {"name": "Wine", "price": 12.00, "quantity": 1}
            ],
            "participants": [
                {"name": "Alice", "items": []},
                {"name": "Bob", "items": []}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/expenses",
            headers={"Authorization": f"Bearer {token}"},
            json=expense_data
        )
        
        if response.status_code != 200:
            print_error(f"Failed to create expense: {response.text}")
            return None
        
        data = response.json()
        expense_id = data.get("id")
        print_success(f"Created expense at Pizza Palace")
        print_data("   Total", f"${expense_data['total_amount']:.2f}")
        print_data("   Items", f"{len(expense_data['items'])} items")
        return expense_id
    
    def create_splits(self, token: str, expense_id: str, contact_id: str) -> bool:
        """Create expense splits"""
        splits_data = {
            "expense_id": expense_id,
            "participants": [
                {
                    "name": "Bob",
                    "contact_id": contact_id,
                    "amount_owed": 25.00,
                    "items_detail": ["Pepperoni Pizza (half)", "Soda", "Garlic Bread (half)"]
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/expenses/{expense_id}/splits",
            headers={"Authorization": f"Bearer {token}"},
            json=splits_data
        )
        
        if response.status_code != 200:
            print_error(f"Failed to create splits: {response.text}")
            return False
        
        print_success("Created expense splits")
        print_data("   Bob owes", "$25.00")
        return True
    
    def get_splits(self, token: str, expense_id: str) -> list:
        """Get expense splits"""
        response = requests.get(
            f"{BASE_URL}/expenses/{expense_id}/splits",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            print_error(f"Failed to get splits: {response.text}")
            return []
        
        data = response.json()
        return data.get("splits", [])
    
    def send_bills(self, token: str, expense_id: str, participant_ids: list) -> bool:
        """Send bills to participants"""
        response = requests.post(
            f"{BASE_URL}/expenses/{expense_id}/send-bills",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "expense_id": expense_id,
                "participant_ids": participant_ids
            }
        )
        
        if response.status_code != 200:
            print_error(f"Failed to send bills: {response.text}")
            return False
        
        data = response.json()
        print_success(f"Sent bills to {data['sent_count']} participant(s)")
        
        for result in data.get("results", []):
            if result['status'] == 'sent':
                print_data(f"   ✉️  {result['participant_name']}", result['message'])
            else:
                print_error(f"   {result['participant_name']}: {result['message']}")
        
        return data['sent_count'] > 0
    
    def get_shared_expenses(self, token: str) -> list:
        """Get expenses shared with this user"""
        response = requests.get(
            f"{BASE_URL}/expenses/shared-with-me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            print_error(f"Failed to get shared expenses: {response.text}")
            return []
        
        data = response.json()
        return data.get("expenses", [])
    
    def run_complete_test(self):
        """Run the complete end-to-end test"""
        print_section("🧪 SmartBill Complete Flow Test")
        
        # Step 1: Register User A
        print_step(1, "Register User A (Alice)")
        self.user_a_token = self.register_user(USER_A_EMAIL, USER_A_PASSWORD)
        if not self.user_a_token:
            print_error("Failed to register User A")
            return False
        time.sleep(1)
        
        # Step 2: Register User B
        print_step(2, "Register User B (Bob)")
        self.user_b_token = self.register_user(USER_B_EMAIL, USER_B_PASSWORD)
        if not self.user_b_token:
            print_error("Failed to register User B")
            return False
        time.sleep(1)
        
        # Step 3: Alice adds Bob as friend
        print_step(3, "Alice adds Bob to contacts (auto bidirectional)")
        self.contact_id = self.add_contact(self.user_a_token, USER_B_EMAIL, "Bob")
        if not self.contact_id:
            print_error("Failed to add contact")
            return False
        time.sleep(1)
        
        # Step 4: Verify both have each other in contacts
        print_step(4, "Verify bidirectional contact relationship")
        alice_contacts = self.get_contacts(self.user_a_token)
        bob_contacts = self.get_contacts(self.user_b_token)
        
        print_data("   Alice's contacts", f"{len(alice_contacts)} friend(s)")
        for contact in alice_contacts:
            print(f"      • {contact['friend_email']}")
        
        print_data("   Bob's contacts", f"{len(bob_contacts)} friend(s)")
        for contact in bob_contacts:
            print(f"      • {contact['friend_email']}")
        
        if len(alice_contacts) == 0 or len(bob_contacts) == 0:
            print_error("Bidirectional contacts not working!")
            return False
        
        print_success("Bidirectional contacts verified!")
        time.sleep(1)
        
        # Step 5: Alice creates an expense
        print_step(5, "Alice creates expense at Pizza Palace")
        self.expense_id = self.create_expense(self.user_a_token)
        if not self.expense_id:
            print_error("Failed to create expense")
            return False
        time.sleep(1)
        
        # Step 6: Alice creates splits
        print_step(6, "Alice creates expense splits")
        if not self.create_splits(self.user_a_token, self.expense_id, self.contact_id):
            print_error("Failed to create splits")
            return False
        time.sleep(1)
        
        # Step 7: Get splits
        print_step(7, "Get expense splits")
        splits = self.get_splits(self.user_a_token, self.expense_id)
        if not splits:
            print_error("No splits found")
            return False
        
        print_success(f"Found {len(splits)} split(s)")
        self.split_ids = [split['id'] for split in splits]
        
        for split in splits:
            print_data(f"   {split['participant_name']}", f"${split['amount_owed']:.2f}")
        time.sleep(1)
        
        # Step 8: Alice sends bills to Bob
        print_step(8, "Alice sends bill email to Bob")
        print_info("Check Bob's email inbox for the bill!")
        if not self.send_bills(self.user_a_token, self.expense_id, self.split_ids):
            print_error("Failed to send bills")
            return False
        time.sleep(1)
        
        # Step 9: Bob views expenses shared with him
        print_step(9, "Bob views expenses shared with him")
        bob_shared_expenses = self.get_shared_expenses(self.user_b_token)
        
        print_data("   Bob's shared expenses", f"{len(bob_shared_expenses)} expense(s)")
        for expense in bob_shared_expenses:
            print(f"      • {expense['store_name']}: ${expense['total_amount']:.2f}")
        
        if len(bob_shared_expenses) == 0:
            print_error("Bob cannot see shared expenses!")
            return False
        
        print_success("Bob can see the expense!")
        time.sleep(1)
        
        # Summary
        print_section("📊 Test Summary")
        print_success("All steps completed successfully!")
        print("\n✅ Verified features:")
        print("   • User registration with email verification")
        print("   • Auto bidirectional contact adding")
        print("   • Expense creation")
        print("   • Expense splitting")
        print("   • Bill email sending")
        print("   • Shared expense viewing")
        
        print("\n📧 Email Status:")
        print(f"   • Check {USER_B_EMAIL} inbox for beautiful split bill email")
        print(f"   • Subject: 'SmartBill - You owe $25.00 for Pizza Palace'")
        
        print("\n💾 Database Status:")
        print(f"   • 2 users registered")
        print(f"   • 2 bidirectional contacts")
        print(f"   • 1 expense created")
        print(f"   • 1 split created")
        print(f"   • 1 email sent")
        
        return True


def main():
    print("\n" + "🚀 SmartBill Complete Flow Test".center(70, "="))
    print("\nThis test will:")
    print("  1. Register two users (Alice & Bob)")
    print("  2. Auto-add them as friends (bidirectional)")
    print("  3. Alice creates expense")
    print("  4. Alice splits bill with Bob")
    print("  5. Alice sends bill email to Bob")
    print("  6. Bob views his shared expenses")
    
    print("\n" + "⚠️  Prerequisites:".center(70, "-"))
    print("  • Auth service running on port 6000")
    print("  • Database initialized")
    print("  • SMTP configured (or check console for verification codes)")
    
    input("\nPress Enter to start test...")
    
    tester = SmartBillTester()
    
    try:
        success = tester.run_complete_test()
        
        if success:
            print("\n" + "="*70)
            print(f"{Colors.GREEN}🎉 ALL TESTS PASSED! 🎉{Colors.NC}".center(78))
            print("="*70)
            print("\n✨ Backend is ready for frontend integration!\n")
        else:
            print("\n" + "="*70)
            print(f"{Colors.RED}❌ SOME TESTS FAILED{Colors.NC}".center(78))
            print("="*70)
            print("\n🔍 Check error messages above for details\n")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()



