"""
Authentication middleware for API Gateway
"""
from fastapi import HTTPException, status, Header
from typing import Optional
from jose import JWTError, jwt
from config import JWT_SECRET_KEY, JWT_ALGORITHM

async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify JWT token locally without calling auth_service.
    This is much faster and reduces load on auth_service.
    
    Returns:
        dict with user_id and email if token is valid
    """
    # 1. Check if Header exists
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Parse Bearer Token
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # 3. Pure local verification (fast mode)
    # If the key (JWT_SECRET_KEY) is correct and the token is not expired, it is valid.
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Extract critical information and return to API routes
        # Note: 'sub' usually contains user_id in JWT standard
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload invalid: missing subject"
            )

        return {
            "valid": True,
            "user_id": user_id, 
            "email": email
        }
        
    except JWTError as e:
        # Catch all errors: expired (ExpiredSignatureError), forged, format errors, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )