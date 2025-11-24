# SmartBill - AI-Powered Expense Splitting Assistant

An intelligent expense splitting platform that uses OCR, Speech-to-Text, and LLM to automate bill management.

## Team Members
- Chuanhui He
- Danyan Gu
- Xing Zhou
- Yingyi Kong

## Project Structure
```
SmartBill/
├── backend/
│   ├── ocr_service/      # OCR module (Yingyi Kong)
│   ├── ai_service/       # AI & STT module
│   └── shared/           # Shared code
├── frontend/             # Vue.js frontend
├── docs/                 # Documentation
└── README.md
```

## Tech Stack

**Backend:**
- Python (FastAPI)
- Google Gemini 2.5 Flash-Lite (OCR)
- OpenAI/Claude API
- Whisper STT

**Frontend:**
- Vue.js
- TailwindCSS

**Database:**
- MySQL/PostgreSQL

## Getting Started

### Backend Setup

#### OCR Service
```bash
cd backend/ocr_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
# Create .env file with: GEMINI_API_KEY=your_api_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```

Visit API docs: http://localhost:8000/docs

**Note**: OCR service requires a Google Gemini API key. Get one from [Google AI Studio](https://makersuite.google.com/app/apikey).

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Documentation

- [Software Requirement Specification](docs/SRS.md)
- [API Documentation](docs/API.md)
- [OCR Service Documentation](backend/ocr_service/README.md)

## License

MIT License