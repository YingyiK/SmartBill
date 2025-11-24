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
- PaddleOCR
- OpenAI/Claude API
- Whisper STT

**Frontend:**
- Vue.js
- TailwindCSS

**Database:**
- MySQL/PostgreSQL

## Getting Started

### Backend Setup
```bash
cd backend/ocr_service
pip install -r requirements.txt
uvicorn ocr_service.main:app --reload --port 8000
```

Visit API docs: http://localhost:8000/docs

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Documentation

- [Software Requirement Specification](docs/SRS.md)
- [API Documentation](docs/API.md)

## License

MIT License