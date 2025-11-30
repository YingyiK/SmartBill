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
│   ├── api_service/      # API Gateway (主 API 服务)
│   ├── auth_service/     # Authentication Service (认证服务)
│   ├── ocr_service/      # OCR module (Yingyi Kong)
│   ├── stt_service/      # Speech-to-Text service
│   ├── ai_service/       # AI & LLM module
│   └── shared/           # Shared code
├── smartbill-app/        # React frontend
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
- React.js
- React Router

**Database:**
- PostgreSQL
- SQLAlchemy (ORM)

**Authentication:**
- JWT (JSON Web Tokens)
- Email verification codes
- SMTP email service

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

#### 1. Database Setup

```bash
# Create PostgreSQL database
createdb smartbill
# Or using psql:
# psql -U postgres
# CREATE DATABASE smartbill;
```

#### 2. Authentication Service (端口 6000)

```bash
cd backend/auth_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file (see backend/auth_service/README.md)
# Initialize database
python init_db.py

# Start the server
python -m uvicorn main:app --reload --port 6000
```

#### 3. OCR Service (端口 8000)

```bash
cd backend/ocr_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with: GEMINI_API_KEY=your_api_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```

#### 4. STT Service (端口 8001)

```bash
cd backend/stt_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with: OPENAI_API_KEY=your_api_key_here

# Start the server
python -m uvicorn main:app --reload --port 8001
```

#### 5. API Gateway Service (端口 5001)

```bash
cd backend/api_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file (see backend/api_service/README.md)

# Start the server
python -m uvicorn main:app --reload --port 5001
```

**注意**: 所有服务都需要同时运行。建议使用多个终端窗口。

### Frontend Setup

```bash
cd smartbill-app
npm install

# Create .env file (optional)
# REACT_APP_API_URL=http://localhost:5001

# Start the development server
npm start
```

前端将在 `http://localhost:3000` 运行

## Documentation

- [Architecture Design](docs/ARCHITECTURE.md) - 系统架构设计
- [Software Requirement Specification](docs/SRS.md)
- [API Documentation](docs/API.md)
- [Authentication Service](backend/auth_service/README.md) - 认证服务文档
- [API Gateway Service](backend/api_service/README.md) - API 网关文档
- [OCR Service Documentation](backend/ocr_service/README.md) - OCR 服务文档

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5001 | 主 API 服务（前端连接此端口） |
| Auth Service | 6000 | 认证服务 |
| OCR Service | 8000 | OCR 服务 |
| STT Service | 8001 | 语音转文字服务 |
| AI Service | 8002 | AI 服务 |
| Frontend | 3000 | React 前端 |

## License

MIT License