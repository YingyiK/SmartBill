"""
Main API Gateway Service - Routes requests to microservices
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
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

# Global HTTP client
http_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the lifecycle of the global HTTP client.
    Created on startup, closed on shutdown.
    """
    global http_client
    # Create a single client instance for the entire application lifespan
    # This enables connection pooling and Keep-Alive
    http_client = httpx.AsyncClient(timeout=60.0)
    yield
    await http_client.aclose()

async def forward_request(
    method: str,
    url: str,
    headers: Optional[dict] = None,
    params: Optional[dict] = None,
    json_data: Optional[dict] = None,
    data: Optional[dict] = None,
    files: Optional[dict] = None,
    timeout: float = None,
    service_name: str = "Service"
):
    """
    Generic helper to forward requests to microservices with unified error handling.
    """
    try:
        response = await http_client.request(
            method,
            url,
            headers=headers,
            params=params,
            json=json_data,
            data=data,
            files=files,
            timeout=timeout
        )
        
        # If the upstream service returns an error status code, propagate it
        if response.status_code >= 400:
             raise HTTPException(
                status_code=response.status_code,
                detail=response.text
            )
        if response.status_code == 204:
                return None 
                
        try:
            return response.json()
        except Exception:
            return response.text         
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"{service_name} unavailable: {str(e)}")

app = FastAPI(title="SmartBill API Gateway", version="1.0.0", lifespan=lifespan)

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
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/send-verification-code",
        json_data=request,
        service_name="Auth service"
    )


@app.post("/api/auth/register")
async def register(request: dict):
    """Forward to auth_service"""
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/register",
        json_data=request,
        service_name="Auth service"
    )


@app.post("/api/auth/login")
async def login(request: dict):
    """Forward to auth_service"""
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/login",
        json_data=request,
        service_name="Auth service"
    )


@app.post("/api/auth/send-password-reset-code")
async def send_password_reset_code(request: dict):
    """Forward to auth_service"""
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/send-password-reset-code",
        json_data=request,
        service_name="Auth service"
    )


@app.post("/api/auth/reset-password")
async def reset_password(request: dict):
    """Forward to auth_service"""
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/reset-password",
        json_data=request,
        service_name="Auth service"
    )


@app.get("/api/auth/me")
async def get_current_user(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get current user info"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/me",
        headers=headers,
        service_name="Auth service"
    )


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
    
    try:
        files = {"image": (image.filename, image_bytes, image.content_type)}
        response = await http_client.post(
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
    try:
        response = await http_client.post(
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
    group_members: Optional[str] = Form(None),  # JSON string from FormData as form field
    ocr_items: Optional[str] = Form(None),  # JSON string array of OCR item names
    current_user_name: Optional[str] = Form(None),  # Current user's name/email username
    user: dict = Depends(verify_token)
):
    """
    Process voice input for expense
    Requires authentication
    group_members: Optional JSON string array of group member names from FormData
    """
    audio_bytes = await audio.read()
    
    try:
        files = {"audio": (audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm")}
        data = {}
        
        # group_members and ocr_items come as strings from FormData
        import json
        
        if group_members:
            try:
                # Parse JSON string to validate it's a list
                members_list = json.loads(group_members)
                
                # Ensure it's a list
                if not isinstance(members_list, list):
                    if isinstance(members_list, str):
                        members_list = [members_list]
                    else:
                        print(f"Warning: group_members is not a list: {type(members_list)}")
                        members_list = []
                
                # Send as JSON string in form data
                if members_list:
                    data["group_members"] = json.dumps(members_list)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Warning: Could not parse group_members as JSON: {e}")
        
        if ocr_items:
            try:
                # Parse JSON string to validate it's a list
                items_list = json.loads(ocr_items)
                
                # Ensure it's a list
                if not isinstance(items_list, list):
                    print(f"Warning: ocr_items is not a list: {type(items_list)}")
                    items_list = []
                
                # Send as JSON string in form data
                if items_list:
                    data["ocr_items"] = json.dumps(items_list)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Warning: Could not parse ocr_items as JSON: {e}")
        
        # Pass current user name (email username) for "I" mapping
        if current_user_name:
            data["current_user_name"] = current_user_name
        elif user and user.get("email"):
            # Extract email username (before @) as default
            email_username = user["email"].split("@")[0]
            data["current_user_name"] = email_username.lower()
        
        # STT service expects multipart/form-data with audio as file
        # and group_members as form field (if provided)
        # When using httpx with files, data fields are sent as form fields
        response = await http_client.post(
            f"{STT_SERVICE_URL}/process-voice-expense",
            files=files,
            data=data,  # This will be sent as form fields
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
    try:
        response = await http_client.post(
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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/expenses",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/expenses",
        params={"limit": limit, "offset": offset},
        headers=headers,
        service_name="Auth service"
    )


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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "DELETE",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
        headers=headers,
        service_name="Auth service"
    )


@app.get("/api/expenses/{expense_id}")
async def get_expense(
    expense_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get a single expense by ID
    """
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
        headers=headers,
        service_name="Auth service"
    )


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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "PUT",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/groups",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.get("/api/groups")
async def get_groups(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get user's groups
    """
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/groups",
        headers=headers,
        service_name="Auth service"
    )


@app.get("/api/groups/{group_id}")
async def get_group(
    group_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Get a single group by ID
    """
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/groups/{group_id}",
        headers=headers,
        service_name="Auth service"
    )


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
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "PUT",
        f"{AUTH_SERVICE_URL}/groups/{group_id}",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.delete("/api/groups/{group_id}")
async def delete_group(
    group_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """
    Delete a group
    """
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "DELETE",
        f"{AUTH_SERVICE_URL}/groups/{group_id}",
        headers=headers,
        service_name="Auth service"
    )


# ==================== Expense Split Routes ====================

@app.post("/api/expenses/{expense_id}/splits")
async def create_expense_splits(
    expense_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Create expense splits"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}/splits",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.get("/api/expenses/{expense_id}/splits")
async def get_expense_splits(
    expense_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get expense splits"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}/splits",
        headers=headers,
        service_name="Auth service"
    )


@app.post("/api/expenses/{expense_id}/send-bills")
async def send_bills_to_participants(
    expense_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Send bills to participants"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/expenses/{expense_id}/send-bills",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.get("/api/expenses/shared-with-me")
async def get_shared_expenses(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get expenses shared with current user"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/expenses/shared-with-me",
        headers=headers,
        service_name="Auth service"
    )


# ==================== Contact Routes ====================

@app.get("/api/contacts")
async def get_contacts(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get user's contacts"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/contacts",
        headers=headers,
        service_name="Auth service"
    )


@app.post("/api/contacts")
async def add_contact(
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Add a contact"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/contacts",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.put("/api/contacts/{contact_id}")
async def update_contact(
    contact_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Update a contact's nickname"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "PUT",
        f"{AUTH_SERVICE_URL}/contacts/{contact_id}",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.delete("/api/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Delete a contact"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "DELETE",
        f"{AUTH_SERVICE_URL}/contacts/{contact_id}",
        headers=headers,
        service_name="Auth service"
    )


# ==================== Contact Group Routes ====================

@app.get("/api/contact-groups")
async def get_contact_groups(
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Get user's contact groups"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "GET",
        f"{AUTH_SERVICE_URL}/contact-groups",
        headers=headers,
        service_name="Auth service"
    )


@app.post("/api/contact-groups")
async def create_contact_group(
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Create a contact group"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "POST",
        f"{AUTH_SERVICE_URL}/contact-groups",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.put("/api/contact-groups/{group_id}")
async def update_contact_group(
    group_id: str,
    request: dict,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Update a contact group"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "PUT",
        f"{AUTH_SERVICE_URL}/contact-groups/{group_id}",
        json_data=request,
        headers=headers,
        service_name="Auth service"
    )


@app.delete("/api/contact-groups/{group_id}")
async def delete_contact_group(
    group_id: str,
    authorization: str = Header(None),
    user: dict = Depends(verify_token)
):
    """Delete a contact group"""
    headers = {"Authorization": authorization} if authorization else {}
    return await forward_request(
        "DELETE",
        f"{AUTH_SERVICE_URL}/contact-groups/{group_id}",
        headers=headers,
        service_name="Auth service"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

