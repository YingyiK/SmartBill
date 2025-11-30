"""
Main API Gateway Service - Routes requests to microservices
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from typing import Optional
import os

from config import (
    AUTH_SERVICE_URL,
    OCR_SERVICE_URL,
    STT_SERVICE_URL,
    AI_SERVICE_URL,
)
from auth_middleware import verify_token

app = FastAPI(title="SmartBill API Gateway", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "api_gateway",
        "services": {
            "auth": AUTH_SERVICE_URL,
            "ocr": OCR_SERVICE_URL,
            "stt": STT_SERVICE_URL,
            "ai": AI_SERVICE_URL,
        }
    }


# ==================== Authentication Routes ====================
# These routes forward to auth_service

@app.post("/api/auth/send-verification-code")
async def send_verification_code(request: dict):
    """Forward to auth_service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/send-verification-code",
                json=request
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.post("/api/auth/register")
async def register(request: dict):
    """Forward to auth_service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/register",
                json=request
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.post("/api/auth/login")
async def login(request: dict):
    """Forward to auth_service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/login",
                json=request
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.post("/api/auth/send-password-reset-code")
async def send_password_reset_code(request: dict):
    """Forward to auth_service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/send-password-reset-code",
                json=request
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.post("/api/auth/reset-password")
async def reset_password(request: dict):
    """Forward to auth_service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/reset-password",
                json=request
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.get("/api/auth/me")
async def get_current_user(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get current user info"""
    # Extract token from authorization header
    token = authorization.split()[1] if authorization else ""
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/me",
                params={"token": token}
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


# ==================== OCR Routes ====================
# These routes forward to ocr_service (requires authentication)

@app.post("/api/ocr/upload")
async def upload_receipt(
    image: UploadFile = File(...),
    user: dict = Depends(verify_token)
):
    """
    Upload receipt image for OCR processing
    Requires authentication
    """
    # Read image bytes
    image_bytes = await image.read()
    
    async with httpx.AsyncClient() as client:
        try:
            files = {"image": (image.filename, image_bytes, image.content_type)}
            response = await client.post(
                f"{OCR_SERVICE_URL}/api/ocr/upload",
                files=files,
                timeout=60.0  # OCR can take time
            )
            if response.status_code == 200:
                result = response.json()
                # Add user_id to result for database storage
                result["user_id"] = user["user_id"]
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"OCR service unavailable: {str(e)}")


@app.post("/api/ocr/test")
async def test_ocr_parser(
    request: dict,
    user: dict = Depends(verify_token)
):
    """
    Test OCR parser with raw text
    Requires authentication
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OCR_SERVICE_URL}/api/ocr/test",
                json=request
            )
            if response.status_code == 200:
                result = response.json()
                result["user_id"] = user["user_id"]
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"OCR service unavailable: {str(e)}")


# ==================== STT Routes ====================
# These routes forward to stt_service (requires authentication)

@app.post("/api/stt/process-voice")
async def process_voice_expense(
    audio: UploadFile = File(...),
    group_members: Optional[str] = None,  # JSON string of group member names
    user: dict = Depends(verify_token)
):
    """
    Process voice input for expense
    Requires authentication
    group_members: Optional JSON string array of group member names
    """
    audio_bytes = await audio.read()
    
    async with httpx.AsyncClient() as client:
        try:
            files = {"audio": (audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm")}
            data = {}
            if group_members:
                import json
                try:
                    members_list = json.loads(group_members)
                    data["group_members"] = members_list
                except json.JSONDecodeError:
                    pass  # Ignore invalid JSON
            
            response = await client.post(
                f"{STT_SERVICE_URL}/process-voice-expense",
                files=files,
                data=data,
                timeout=60.0
            )
            if response.status_code == 200:
                result = response.json()
                result["user_id"] = user["user_id"]
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"STT service unavailable: {str(e)}")


# ==================== AI Routes ====================
# These routes forward to ai_service (requires authentication)

@app.post("/api/ai/analyze-expense")
async def analyze_expense(
    request: dict,
    user: dict = Depends(verify_token)
):
    """
    Analyze expense using AI
    Requires authentication
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/ai/analyze-expense",
                json=request
            )
            if response.status_code == 200:
                result = response.json()
                result["user_id"] = user["user_id"]
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")


# ==================== Expense Routes ====================

@app.post("/api/expenses")
async def create_expense(
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Create a new expense
    Requires authentication
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.post(
                f"{AUTH_SERVICE_URL}/expenses",
                json=request,
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.get("/api/expenses")
async def get_expenses(
    authorization: str = Header(None),
    user: dict = Depends(verify_token),
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's expenses
    Requires authentication
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.get(
                f"{AUTH_SERVICE_URL}/expenses",
                params={"limit": limit, "offset": offset},
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.delete("/api/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Delete an expense
    Requires authentication
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.delete(
                f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.get("/api/expenses/{expense_id}")
async def get_expense(
    expense_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get a single expense by ID
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.get(
                f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.put("/api/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Update an expense
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.put(
                f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
                json=request,
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


# ==================== Group Routes ====================

@app.post("/api/groups")
async def create_group(
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Create a new group
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.post(
                f"{AUTH_SERVICE_URL}/groups",
                json=request,
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.get("/api/groups")
async def get_groups(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get user's groups
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.get(
                f"{AUTH_SERVICE_URL}/groups",
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.get("/api/groups/{group_id}")
async def get_group(
    group_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get a single group by ID
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.get(
                f"{AUTH_SERVICE_URL}/groups/{group_id}",
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.put("/api/groups/{group_id}")
async def update_group(
    group_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Update a group
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.put(
                f"{AUTH_SERVICE_URL}/groups/{group_id}",
                json=request,
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


@app.delete("/api/groups/{group_id}")
async def delete_group(
    group_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Delete a group
    """
    async with httpx.AsyncClient() as client:
        try:
            headers = {}
            if authorization:
                headers["Authorization"] = authorization
            
            response = await client.delete(
                f"{AUTH_SERVICE_URL}/groups/{group_id}",
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

