"""
Test script for OCR service
"""
import requests
import json

# Base URL
BASE_URL = "http://127.0.0.1:8000"

def test_parser():
    """Test the parser with raw text"""
    url = f"{BASE_URL}/api/ocr/test"
    
    # Test text (your receipt text)
    test_text = """Give us feedback @ survey.walmart.com
Thank you! ID #:7VRCG21WVFL4
Walmart
WM Supercenter
408-885-1142 Mgr. RENARDO
777 STORY RD
SAN JOSE CA 95122
ST# 05435 OP# 009003 TE# 03 TR# 01839

# ITEMS SOLD 6
TC# 6012 0108 1245 5413 1513

ROTH CREAMY 736547566780 F 3.97 N
GOODLES 850031990510 F
1.000 oz @ 1 oz /3.48 3.48 N
** VOIDED ENTRY **
GOODLES 850031990510 F
SILOSTFD RED 829354103800 F 5.48 N
FGF JLP BTS 899039002760 F 6.88 N
CHOCOLATE 850041392020 F
1.000 oz @ 1 oz /5.97 5.97 N
LYCHEE 840269200220 F 6.97 X

SUBTOTAL 32.75
TAX1 9.3750 % 0.65
TOTAL 33.40
VISA TEND 33.40
CHANGE DUE 0.00"""
    
    response = requests.post(url, params={"text": test_text})
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Test successful!")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Test failed: {response.status_code}")
        print(response.text)

def test_upload(image_path):
    """Test OCR with image upload"""
    url = f"{BASE_URL}/api/ocr/upload"
    
    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ OCR successful!")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ OCR failed: {response.status_code}")
        print(response.text)

def test_health():
    """Test health check"""
    url = f"{BASE_URL}/health"
    try:
        response = requests.get(url, timeout=5)
        print("Health check:", response.json())
    except requests.exceptions.ConnectionError:
        print("❌ Connection refused! Make sure the server is running:")
        print("   python -m uvicorn main:app --reload --port 8000")
        return False
    return True

if __name__ == "__main__":
    print("Testing OCR Service...\n")
    
    # Test health check
    print("1. Health check:")
    if not test_health():
        print("\n⚠️  Please start the server first:")
        print("   cd backend/ocr_service")
        print("   source venv/bin/activate")
        print("   python -m uvicorn main:app --reload --port 8000")
        exit(1)
    print()
    
    # Test parser
    print("2. Testing parser (text only):")
    test_parser()
    print()
    
    # Uncomment to test with image
    # print("3. Testing OCR (with image):")
    # test_upload("path/to/your/receipt.jpg")

