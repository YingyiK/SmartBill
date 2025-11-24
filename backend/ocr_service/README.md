# SmartBill OCR Service

AI-powered receipt OCR service that extracts structured data from receipt images using Google Gemini API.

## Features

- 📸 **Image OCR**: Extract text from receipt images using Google Gemini 2.5 Flash-Lite
- 📋 **Smart Parsing**: Automatically parse receipt text into structured data (items, prices, totals, tax)
- 🧾 **Receipt Analysis**: Extract store name, subtotal, tax amount, and total
- 🔍 **Multi-line Price Support**: Handles items with prices on separate lines
- ❌ **Voided Entry Detection**: Automatically skips voided/cancelled items
- 💰 **Tax Calculation**: Identifies tax indicators (X/N) and applies tax multipliers
- 🛡️ **Error Handling**: Robust error handling and logging

## Tech Stack

- **Framework**: FastAPI
- **OCR Engine**: Google Gemini 2.5 Flash-Lite API
- **Image Processing**: Pillow
- **Language**: Python 3.12+

## Installation

### Prerequisites

- Python 3.12 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup

1. **Clone the repository** (if not already done):
   ```bash
   cd backend/ocr_service
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   
   Create a `.env` file in the `ocr_service` directory or project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Usage

### Start the Server

```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Health Check

```http
GET /
```

Returns service status and information.

**Response:**
```json
{
  "service": "SmartBill OCR API",
  "status": "running",
  "version": "1.0.0",
  "ocr_engine": "Google Gemini"
}
```

### 2. Upload Receipt Image

```http
POST /api/ocr/upload
Content-Type: multipart/form-data
```

Upload a receipt image for OCR processing.

**Request:**
- `image`: Image file (JPEG, PNG, etc.)

**Response:**
```json
{
  "success": true,
  "raw_text": "Extracted text from receipt...",
  "items": [
    {
      "name": "Item Name",
      "price": 25.99,
      "quantity": 1
    }
  ],
  "total": 33.40,
  "subtotal": 32.75,
  "tax_amount": 0.65,
  "tax_rate": 0.08,
  "store_name": "WALMART"
}
```

### 3. Test Parser (Text Only)

```http
POST /api/ocr/test?text=Receipt text here
```

Test the receipt parser with raw text (without OCR).

**Query Parameters:**
- `text`: Raw receipt text to parse

**Response:** Same as upload endpoint

## Example Usage

### Using cURL

```bash
# Upload receipt image
curl -X POST "http://localhost:8000/api/ocr/upload" \
  -F "image=@/path/to/receipt.jpg"

# Test parser with text
curl -X POST "http://localhost:8000/api/ocr/test?text=SUBTOTAL%2032.75%0ATOTAL%2033.40"
```

### Using Python

```python
import requests

# Upload receipt image
with open("receipt.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/ocr/upload",
        files={"image": f}
    )
    result = response.json()
    print(result)

# Test parser
response = requests.post(
    "http://localhost:8000/api/ocr/test",
    params={"text": "SUBTOTAL 32.75\nTOTAL 33.40"}
)
print(response.json())
```

## Project Structure

```
ocr_service/
├── main.py                 # FastAPI application
├── gemini_ocr_engine.py    # Google Gemini OCR engine
├── parser.py               # Receipt text parser
├── models.py               # Pydantic data models
├── requirements.txt        # Python dependencies
├── test_ocr.py            # Test script
└── README.md              # This file
```

## Features Details

### Receipt Parsing

The parser can extract:
- **Items**: Product names, prices, and quantities
- **Subtotal**: Pre-tax total amount
- **Tax Amount**: Tax charged on the receipt
- **Total**: Final amount including tax
- **Store Name**: Detected store name from common patterns

### Supported Receipt Formats

- Multi-line prices (item name on one line, price on next)
- Weight-based items (e.g., "1.000 oz @ 1 oz /5.97 5.97 N")
- Tax indicators (X = taxable, N = non-taxable)
- Voided entries (automatically skipped)
- Various store formats (Walmart, Costco, Target, etc.)

## Error Handling

The service includes comprehensive error handling:
- Invalid image format
- Missing API key
- OCR extraction failures
- Parsing errors

All errors return appropriate HTTP status codes and error messages.

## Development

### Running Tests

```bash
# Run the test script
python test_ocr.py
```

### Logging

Logs are configured to output to console with INFO level. Check server logs for debugging information.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## License

MIT License

## Author

Yingyi Kong - SmartBill OCR Service Module

