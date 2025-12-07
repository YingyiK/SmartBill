# SmartBill API Gateway Service

The main API Gateway that unifies frontend requests and routes them to respective microservices.

## Features

- ✅ **Unified API Entry Point**: Single endpoint for all frontend clients.
- ✅ **JWT Authentication Middleware**: Centralized token verification.
- ✅ **Request Forwarding**: Efficiently routes requests to Auth, OCR, STT, and AI services.
- ✅ **Performance Optimized**: Uses a global singleton `httpx.AsyncClient` with connection pooling and Keep-Alive.
- ✅ **Unified Error Handling**: Automatically propagates HTTP error status codes (e.g., 401, 404) from upstream services to the client.

## Tech Stack

- **Framework**: FastAPI
- **HTTP Client**: httpx (Async)
- **Authentication**: JWT (python-jose)

## Installation

### 1. Create Virtual Environment

```bash
cd backend/api_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
# Service URLs
AUTH_SERVICE_URL=http://localhost:6000
OCR_SERVICE_URL=http://localhost:8000
STT_SERVICE_URL=http://localhost:8001
AI_SERVICE_URL=http://localhost:8002

# JWT (must match auth_service)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

### 4. Start the Service

```bash
python -m uvicorn main:app --reload --port 5001
```

The service will run at `http://localhost:5001`.

## API Endpoints

### Authentication (Forwards to `auth_service`)

- `POST /api/auth/send-verification-code` - Send email verification code
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-password-reset-code` - Send password reset code
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user info (Requires Auth)

### Expenses (Forwards to `auth_service`)

- `POST /api/expenses` - Create new expense
- `GET /api/expenses` - Get user expenses
- `GET /api/expenses/{id}` - Get expense details
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/expenses/shared-with-me` - Get shared expenses

### Groups & Contacts (Forwards to `auth_service`)

- `GET /api/groups` - Get user groups
- `POST /api/groups` - Create group
- `GET /api/contacts` - Get contacts
- `POST /api/contacts` - Add contact
- `GET /api/contact-groups` - Get contact groups

### Splits (Forwards to `auth_service`)

- `POST /api/expenses/{id}/splits` - Create expense splits
- `GET /api/expenses/{id}/splits` - Get expense splits
- `POST /api/expenses/{id}/send-bills` - Send split bills via email

### OCR (Forwards to `ocr_service`)

- `POST /api/ocr/upload` - Upload receipt image for processing
- `POST /api/ocr/test` - Test OCR parser

### STT (Forwards to `stt_service`)

- `POST /api/stt/process-voice` - Process voice input for expense creation

### AI (Forwards to `ai_service`)

- `POST /api/ai/analyze-expense` - Analyze expense details using AI

## Authentication

Protected endpoints require a JWT Token in the request header:

```http
Authorization: Bearer <token>
```

## Architecture Notes

### Request Forwarding
The gateway uses a helper function `forward_request` to handle all upstream calls. This ensures:
1.  **Consistent Error Handling**: If an upstream service returns `4xx` or `5xx`, the gateway raises the same HTTP exception.
2.  **Header Propagation**: Authentication headers are correctly forwarded.
3.  **Performance**: Reuses a single `http_client` instance created during the application startup (`lifespan`).

### Development

#### Testing
Use Swagger UI to test APIs interactively:
```
http://localhost:5001/docs
```

#### Important Notes
1.  **Service Dependencies**: Ensure all microservices are running.
2.  **JWT Secret**: Must match the `JWT_SECRET_KEY` in `auth_service`.
3.  **CORS**: Configured to allow `localhost:3000` (React frontend).
