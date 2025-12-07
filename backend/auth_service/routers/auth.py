"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from dependencies import get_db, get_current_user
from models import User, EmailVerificationCode, PasswordResetCode
from schemas import (
    RegisterRequest,
    LoginRequest,
    SendVerificationCodeRequest,
    TokenResponse,
    UserResponse,
    PasswordResetRequest,
    MessageResponse,
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from email_service import send_verification_email, generate_verification_code

router = APIRouter()

@router.post("/send-verification-code", response_model=MessageResponse)
async def send_verification_code(
    request: SendVerificationCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Send verification code to email
    """
    email = request.email.lower()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate verification code
    code = generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Save verification code
    verification = EmailVerificationCode(
        email=email,
        code=code,
        expires_at=expires_at
    )
    db.add(verification)
    db.commit()
    
    # Send email
    await send_verification_email(email, code, "registration")
    
    return MessageResponse(message="Verification code sent to email")


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email verification code
    """
    email = request.email.lower()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verify code
    verification = (
        db.query(EmailVerificationCode)
        .filter(
            EmailVerificationCode.email == email,
            EmailVerificationCode.code == request.verification_code,
            EmailVerificationCode.used == False,
            EmailVerificationCode.expires_at > datetime.utcnow()
        )
        .first()
    )
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Mark code as used
    verification.used = True
    
    # Create user
    user = User(
        email=email,
        password_hash=get_password_hash(request.password),
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user_id=str(user.id),
        email=user.email
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password
    """
    email = request.email.lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user_id=str(user.id),
        email=user.email
    )


@router.post("/send-password-reset-code", response_model=MessageResponse)
async def send_password_reset_code(
    request: SendVerificationCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Send password reset verification code
    """
    email = request.email.lower()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if user exists
        return MessageResponse(message="If email exists, reset code sent")
    
    # Generate reset code
    code = generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Save reset code
    reset_code = PasswordResetCode(
        email=email,
        code=code,
        expires_at=expires_at
    )
    db.add(reset_code)
    db.commit()
    
    # Send email
    await send_verification_email(email, code, "password_reset")
    
    return MessageResponse(message="If email exists, reset code sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password with verification code
    """
    email = request.email.lower()
    
    # Verify code
    reset_code = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.email == email,
            PasswordResetCode.code == request.verification_code,
            PasswordResetCode.used == False,
            PasswordResetCode.expires_at > datetime.utcnow()
        )
        .first()
    )
    
    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(request.new_password)
    reset_code.used = True
    db.commit()
    
    return MessageResponse(message="Password reset successfully")


@router.get("/verify-token")
async def verify_token_endpoint(token: str):
    """
    Verify JWT token (used by api_service)
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return {"valid": True, "user_id": payload.get("sub"), "email": payload.get("email")}


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user info
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.email.split('@')[0],
        email_verified=current_user.email_verified,
        created_at=current_user.created_at
    )

