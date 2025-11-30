"""
Authentication Service - Email registration and login
"""
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from database import get_db, init_db
from models import User, EmailVerificationCode, PasswordResetCode, Expense, ExpenseItem, ExpenseParticipant, Group, GroupMember
from schemas import (
    RegisterRequest,
    LoginRequest,
    SendVerificationCodeRequest,
    TokenResponse,
    UserResponse,
    PasswordResetRequest,
    MessageResponse,
)
from expense_schemas import CreateExpenseRequest, ExpenseResponse, ExpenseListResponse, ExpenseItemSchema, ExpenseParticipantSchema
from group_schemas import CreateGroupRequest, UpdateGroupRequest, GroupResponse, GroupListResponse, GroupMemberSchema
from auth import verify_password, get_password_hash, create_access_token, verify_token
from email_service import send_verification_email, generate_verification_code
import uuid as uuid_lib
import json

app = FastAPI(title="SmartBill Auth Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth_service"}


@app.post("/send-verification-code", response_model=MessageResponse)
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
    await send_verification_email(email, code, "注册")
    
    return MessageResponse(message="Verification code sent to email")


@app.post("/register", response_model=TokenResponse)
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


@app.post("/login", response_model=TokenResponse)
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


@app.post("/send-password-reset-code", response_model=MessageResponse)
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
    await send_verification_email(email, code, "重置密码")
    
    return MessageResponse(message="If email exists, reset code sent")


@app.post("/reset-password", response_model=MessageResponse)
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


@app.get("/verify-token")
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


@app.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get current user info from token
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        email_verified=user.email_verified,
        created_at=user.created_at
    )


# ==================== Expense Routes ====================

@app.post("/expenses", response_model=ExpenseResponse)
async def create_expense(
    request: CreateExpenseRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Create a new expense
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    # Convert string UUID to UUID object
    import uuid as uuid_lib
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Create expense
    expense = Expense(
        user_id=user_id,
        store_name=request.store_name,
        total_amount=float(request.total_amount),
        subtotal=float(request.subtotal) if request.subtotal is not None else None,
        tax_amount=float(request.tax_amount) if request.tax_amount is not None else None,
        tax_rate=float(request.tax_rate) if request.tax_rate is not None else None,
        raw_text=request.raw_text,
        transcript=request.transcript
    )
    db.add(expense)
    db.flush()  # Get expense.id
    
    # Create expense items
    for item_data in request.items:
        item = ExpenseItem(
            expense_id=expense.id,
            name=item_data.name,
            price=float(item_data.price),
            quantity=float(item_data.quantity) if item_data.quantity is not None else 1.0
        )
        db.add(item)
    
    # Create expense participants
    for participant_data in request.participants:
        participant = ExpenseParticipant(
            expense_id=expense.id,
            name=participant_data.name,
            items=json.dumps(participant_data.items) if participant_data.items else None
        )
        db.add(participant)
    
    db.commit()
    db.refresh(expense)
    
    # Fetch items and participants
    items = db.query(ExpenseItem).filter(ExpenseItem.expense_id == expense.id).all()
    participants = db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id == expense.id).all()
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        store_name=expense.store_name,
        total_amount=float(expense.total_amount),
        subtotal=float(expense.subtotal) if expense.subtotal else None,
        tax_amount=float(expense.tax_amount) if expense.tax_amount else None,
        tax_rate=float(expense.tax_rate) if expense.tax_rate else None,
        raw_text=expense.raw_text,
        transcript=expense.transcript,
        items=[
            ExpenseItemSchema(name=item.name, price=float(item.price), quantity=int(item.quantity))
            for item in items
        ],
        participants=[
            ExpenseParticipantSchema(
                name=p.name,
                items=json.loads(p.items) if p.items else []
            )
            for p in participants
        ],
        created_at=expense.created_at
    )


@app.get("/expenses", response_model=ExpenseListResponse)
async def get_expenses(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's expenses
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    # Convert string UUID to UUID object
    import uuid as uuid_lib
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Get expenses
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    total = db.query(Expense).filter(Expense.user_id == user_id).count()
    
    expense_responses = []
    for expense in expenses:
        items = db.query(ExpenseItem).filter(ExpenseItem.expense_id == expense.id).all()
        participants = db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id == expense.id).all()
        
        expense_responses.append(ExpenseResponse(
            id=str(expense.id),
            user_id=str(expense.user_id),
            store_name=expense.store_name,
            total_amount=float(expense.total_amount),
            subtotal=float(expense.subtotal) if expense.subtotal else None,
            tax_amount=float(expense.tax_amount) if expense.tax_amount else None,
            tax_rate=float(expense.tax_rate) if expense.tax_rate else None,
            raw_text=expense.raw_text,
            transcript=expense.transcript,
            items=[
                ExpenseItemSchema(name=item.name, price=float(item.price), quantity=int(item.quantity))
                for item in items
            ],
            participants=[
                ExpenseParticipantSchema(
                    name=p.name,
                    items=json.loads(p.items) if p.items else []
                )
                for p in participants
            ],
            created_at=expense.created_at
        ))
    
    return ExpenseListResponse(expenses=expense_responses, total=total)


@app.delete("/expenses/{expense_id}", response_model=MessageResponse)
async def delete_expense(
    expense_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Delete an expense
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    # Convert string UUID to UUID object
    try:
        user_id = uuid_lib.UUID(user_id_str)
        expense_uuid = uuid_lib.UUID(expense_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find expense and verify ownership
    expense = db.query(Expense).filter(
        Expense.id == expense_uuid,
        Expense.user_id == user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Delete expense (cascade will delete items and participants)
    db.delete(expense)
    db.commit()
    
    return MessageResponse(message="Expense deleted successfully")


# ==================== Group Routes ====================

@app.post("/groups", response_model=GroupResponse)
async def create_group(
    request: CreateGroupRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Create a new group
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Create group
    group = Group(
        user_id=user_id,
        name=request.name,
        description=request.description
    )
    db.add(group)
    db.flush()
    
    # Create group members
    for member_data in request.members:
        member = GroupMember(
            group_id=group.id,
            name=member_data.name,
            email=member_data.email
        )
        db.add(member)
    
    db.commit()
    db.refresh(group)
    
    # Fetch members
    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    
    return GroupResponse(
        id=str(group.id),
        user_id=str(group.user_id),
        name=group.name,
        description=group.description,
        members=[
            GroupMemberSchema(name=m.name, email=m.email)
            for m in members
        ],
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@app.get("/groups", response_model=GroupListResponse)
async def get_groups(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get user's groups
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Get groups
    groups = db.query(Group).filter(Group.user_id == user_id).order_by(Group.created_at.desc()).all()
    
    group_responses = []
    for group in groups:
        members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        group_responses.append(GroupResponse(
            id=str(group.id),
            user_id=str(group.user_id),
            name=group.name,
            description=group.description,
            members=[
                GroupMemberSchema(name=m.name, email=m.email)
                for m in members
            ],
            created_at=group.created_at,
            updated_at=group.updated_at
        ))
    
    return GroupListResponse(groups=group_responses, total=len(group_responses))


@app.get("/groups/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get a single group by ID
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    try:
        user_id = uuid_lib.UUID(user_id_str)
        group_uuid = uuid_lib.UUID(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find group and verify ownership
    group = db.query(Group).filter(
        Group.id == group_uuid,
        Group.user_id == user_id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Fetch members
    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    
    return GroupResponse(
        id=str(group.id),
        user_id=str(group.user_id),
        name=group.name,
        description=group.description,
        members=[
            GroupMemberSchema(name=m.name, email=m.email)
            for m in members
        ],
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@app.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    request: UpdateGroupRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Update a group
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    try:
        user_id = uuid_lib.UUID(user_id_str)
        group_uuid = uuid_lib.UUID(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find group and verify ownership
    group = db.query(Group).filter(
        Group.id == group_uuid,
        Group.user_id == user_id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Update group fields
    if request.name is not None:
        group.name = request.name
    if request.description is not None:
        group.description = request.description
    
    # Update members if provided
    if request.members is not None:
        # Delete existing members
        db.query(GroupMember).filter(GroupMember.group_id == group.id).delete()
        
        # Create new members
        for member_data in request.members:
            member = GroupMember(
                group_id=group.id,
                name=member_data.name,
                email=member_data.email
            )
            db.add(member)
    
    db.commit()
    db.refresh(group)
    
    # Fetch updated members
    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    
    return GroupResponse(
        id=str(group.id),
        user_id=str(group.user_id),
        name=group.name,
        description=group.description,
        members=[
            GroupMemberSchema(name=m.name, email=m.email)
            for m in members
        ],
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@app.delete("/groups/{group_id}", response_model=MessageResponse)
async def delete_group(
    group_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Delete a group
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
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
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    
    try:
        user_id = uuid_lib.UUID(user_id_str)
        group_uuid = uuid_lib.UUID(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find group and verify ownership
    group = db.query(Group).filter(
        Group.id == group_uuid,
        Group.user_id == user_id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Delete group (cascade will delete members)
    db.delete(group)
    db.commit()
    
    return MessageResponse(message="Group deleted successfully")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6000)

