#!/usr/bin/env python3
"""
Test email registration and login functionality
Make sure auth_service is running on port 6000
"""
import requests
import json
from datetime import datetime

# Configuration
AUTH_SERVICE_URL = "http://localhost:6000"
TEST_EMAIL = input("Enter test email address: ").strip()
TEST_PASSWORD = input("Enter test password (min 6 characters): ").strip()

# Color output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.NC}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.NC}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.NC}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.NC}")

def print_response(response):
    """Print API response"""
    try:
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"   Raw Response: {response.text}")

def test_health():
    """Test service health status"""
    print("\n" + "="*60)
    print("🏥 Testing Service Health...")
    print("="*60)
    
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Auth Service is running")
            print_response(response)
            return True
        else:
            print_error("Auth Service returned abnormal status")
            print_response(response)
            return False
    except requests.exceptions.ConnectionError:
        print_error("Unable to connect to Auth Service")
        print_info("Please ensure service is running at http://localhost:6000")
        print_info("Start command: cd backend/auth_service && source venv/bin/activate && python -m uvicorn main:app --reload --port 6000")
        return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False

def send_verification_code(email):
    """Send verification code"""
    print("\n" + "="*60)
    print("📧 Step 1: Sending Verification Code...")
    print("="*60)
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/send-verification-code",
            json={"email": email},
            timeout=10
        )
        
        if response.status_code == 200:
            print_success(f"Verification code sent to {email}")
            print_response(response)
            print_info("Please check your email inbox (including spam folder)")
            return True
        elif response.status_code == 400:
            error_detail = response.json().get("detail", "Unknown error")
            if "already registered" in error_detail:
                print_warning(f"Email already registered: {email}")
                print_info("You can proceed directly to test login")
                return False
            else:
                print_error(f"Failed to send verification code: {error_detail}")
                print_response(response)
                return False
        else:
            print_error("Failed to send verification code")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Request failed: {e}")
        return False

def register(email, password, verification_code):
    """Register user"""
    print("\n" + "="*60)
    print("📝 Step 2: Registering User...")
    print("="*60)
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/register",
            json={
                "email": email,
                "password": password,
                "verification_code": verification_code
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Registration successful!")
            print_response(response)
            return data.get("access_token")
        else:
            print_error("Registration failed")
            print_response(response)
            return None
    except Exception as e:
        print_error(f"Request failed: {e}")
        return None

def login(email, password):
    """Login"""
    print("\n" + "="*60)
    print("🔐 Step 3: Testing Login...")
    print("="*60)
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/login",
            json={
                "email": email,
                "password": password
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Login successful!")
            print_response(response)
            return data.get("access_token")
        else:
            print_error("Login failed")
            print_response(response)
            return None
    except Exception as e:
        print_error(f"Request failed: {e}")
        return None

def get_user_info(token):
    """Get user information"""
    print("\n" + "="*60)
    print("👤 Step 4: Getting User Information...")
    print("="*60)
    
    try:
        response = requests.get(
            f"{AUTH_SERVICE_URL}/me",
            params={"token": token},
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Successfully retrieved user information")
            print_response(response)
            return True
        else:
            print_error("Failed to retrieve user information")
            print_response(response)
            return False
    except Exception as e:
        print_error(f"Request failed: {e}")
        return False

def test_password_reset(email):
    """Test password reset"""
    print("\n" + "="*60)
    print("🔄 Additional Test: Password Reset Flow")
    print("="*60)
    
    choice = input("Do you want to test password reset functionality? (y/n): ").strip().lower()
    if choice != 'y':
        print_info("Skipping password reset test")
        return
    
    # Send reset verification code
    print("\n📧 Sending password reset verification code...")
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/send-password-reset-code",
            json={"email": email},
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Password reset verification code sent")
            print_response(response)
            
            # Input verification code and new password
            reset_code = input("\nEnter reset verification code: ").strip()
            new_password = input("Enter new password: ").strip()
            
            # Reset password
            print("\n🔄 Resetting password...")
            reset_response = requests.post(
                f"{AUTH_SERVICE_URL}/reset-password",
                json={
                    "email": email,
                    "verification_code": reset_code,
                    "new_password": new_password
                },
                timeout=10
            )
            
            if reset_response.status_code == 200:
                print_success("Password reset successful!")
                print_response(reset_response)
                
                # Test login with new password
                print("\n🔐 Testing login with new password...")
                token = login(email, new_password)
                if token:
                    print_success("Login with new password successful!")
            else:
                print_error("Password reset failed")
                print_response(reset_response)
        else:
            print_error("Failed to send reset verification code")
            print_response(response)
    except Exception as e:
        print_error(f"Password reset test failed: {e}")

def main():
    """Main test flow"""
    print("\n" + "🧪 SmartBill Email Registration & Login Test".center(60, "="))
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Test Password: {'*' * len(TEST_PASSWORD)}")
    print("="*60)
    
    # 0. Test service health status
    if not test_health():
        return
    
    # 1. Send verification code
    if not send_verification_code(TEST_EMAIL):
        # If email already registered, test login directly
        print_info("Email already registered, testing login directly...")
        token = login(TEST_EMAIL, TEST_PASSWORD)
        if token:
            get_user_info(token)
            test_password_reset(TEST_EMAIL)
        return
    
    # 2. Input verification code
    print("\n" + "-"*60)
    verification_code = input("Enter the verification code you received: ").strip()
    print("-"*60)
    
    if not verification_code:
        print_error("Verification code cannot be empty")
        return
    
    # 3. Register
    token = register(TEST_EMAIL, TEST_PASSWORD, verification_code)
    if not token:
        return
    
    # 4. Get user information
    get_user_info(token)
    
    # 5. Test login
    login_token = login(TEST_EMAIL, TEST_PASSWORD)
    if login_token:
        get_user_info(login_token)
    
    # 6. Test password reset (optional)
    test_password_reset(TEST_EMAIL)
    
    # Complete
    print("\n" + "="*60)
    print_success("All tests completed!")
    print("="*60)
    print("\n📊 Test Summary:")
    print(f"   • Email: {TEST_EMAIL}")
    print(f"   • Registration: {'✅ Success' if token else '❌ Failed'}")
    print(f"   • Login: {'✅ Success' if login_token else '❌ Failed'}")
    print("\n💡 Tips:")
    print("   • Token has been generated for subsequent API calls")
    print("   • You can use this account to login on the frontend")
    print("   • Data has been saved to PostgreSQL database")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print_warning("Test interrupted by user")
        print("="*60)
    except Exception as e:
        print("\n\n" + "="*60)
        print_error(f"Error occurred during testing: {e}")
        print("="*60)
        import traceback
        traceback.print_exc()
