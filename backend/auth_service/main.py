"""
Authentication Service - Email registration and login
"""
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from database import get_db, init_db
from models import User, EmailVerificationCode, PasswordResetCode, Expense, ExpenseItem, ExpenseParticipant, Group, GroupMember, Contact, ContactGroup, ContactGroupMember, ExpenseSplit
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
from contact_schemas import AddContactRequest, UpdateContactRequest, ContactResponse, ContactListResponse
from contact_group_schemas import (
    CreateContactGroupRequest,
    UpdateContactGroupRequest,
    ContactGroupResponse,
    ContactGroupListResponse,
    ContactGroupMemberSchema
)
from split_schemas import (
    CreateExpenseSplitRequest,
    ExpenseSplitResponse,
    ExpenseSplitListResponse,
    SendBillRequest,
    SendBillResponse
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from email_service import send_verification_email, send_split_bill_email, generate_verification_code
import uuid as uuid_lib
import json
from decimal import Decimal

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
    await send_verification_email(email, code, "registration")
    
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
    await send_verification_email(email, code, "password_reset")
    
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


@app.get("/expenses/shared-with-me", response_model=ExpenseListResponse)
async def get_shared_expenses(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    Get expenses where user is a participant (not creator)
    Shows bills that others have split with this user
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
    
    # Get user's contact to find their email
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Find all expense splits where this user is a participant
    splits = db.query(ExpenseSplit).filter(
        ExpenseSplit.participant_email == user.email
    ).order_by(ExpenseSplit.created_at.desc()).limit(limit).offset(offset).all()
    
    # Get unique expense IDs
    expense_ids = list(set([split.expense_id for split in splits]))
    
    # Get expenses (but not created by this user)
    expenses = db.query(Expense).filter(
        Expense.id.in_(expense_ids),
        Expense.user_id != user_id
    ).all()
    
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
    
    return ExpenseListResponse(expenses=expense_responses, total=len(expense_responses))


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


# ==================== Contact/Friend Management Routes ====================

@app.post("/contacts", response_model=ContactResponse)
async def add_contact(
    request: AddContactRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Add a friend to contacts (must be a registered user)
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find friend by email
    friend = db.query(User).filter(User.email == request.friend_email.lower()).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email is not registered"
        )
    
    # Check if trying to add self
    if friend.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as a contact"
        )
    
    # Check if already in contacts
    existing = db.query(Contact).filter(
        Contact.user_id == user_id,
        Contact.friend_user_id == friend.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is already in your contacts"
        )
    
    # Create contact (A -> B)
    contact = Contact(
        user_id=user_id,
        friend_user_id=friend.id,
        nickname=request.nickname
    )
    db.add(contact)
    
    # Auto-create reverse contact (B -> A) if not exists
    # B's nickname for A should be default (email username)
    reverse_existing = db.query(Contact).filter(
        Contact.user_id == friend.id,
        Contact.friend_user_id == user_id
    ).first()
    
    if not reverse_existing:
        # Default nickname is email username (before @)
        default_nickname = user.email.split('@')[0]
        reverse_contact = Contact(
            user_id=friend.id,
            friend_user_id=user_id,
            nickname=default_nickname
        )
        db.add(reverse_contact)
    
    db.commit()
    db.refresh(contact)
    
    return ContactResponse(
        id=str(contact.id),
        user_id=str(contact.user_id),
        friend_user_id=str(contact.friend_user_id),
        friend_email=friend.email,
        nickname=contact.nickname,
        created_at=contact.created_at
    )


@app.get("/contacts", response_model=ContactListResponse)
async def get_contacts(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get user's contact list
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Get contacts with friend info
    contacts = db.query(Contact).filter(Contact.user_id == user_id).all()
    
    contact_responses = []
    for contact in contacts:
        friend = db.query(User).filter(User.id == contact.friend_user_id).first()
        if friend:
            contact_responses.append(ContactResponse(
                id=str(contact.id),
                user_id=str(contact.user_id),
                friend_user_id=str(contact.friend_user_id),
                friend_email=friend.email,
                nickname=contact.nickname,
                created_at=contact.created_at
            ))
    
    return ContactListResponse(contacts=contact_responses, total=len(contact_responses))


@app.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    request: UpdateContactRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Update a contact's nickname
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        contact_uuid = uuid_lib.UUID(contact_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify contact ownership
    contact = db.query(Contact).filter(
        Contact.id == contact_uuid,
        Contact.user_id == user_id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Update nickname only (nickname can be empty string to reset to default)
    if request.nickname is not None:
        contact.nickname = request.nickname if request.nickname else None
    
    db.commit()
    db.refresh(contact)
    
    # Get friend user info
    friend = db.query(User).filter(User.id == contact.friend_user_id).first()
    
    return ContactResponse(
        id=str(contact.id),
        user_id=str(contact.user_id),
        friend_user_id=str(contact.friend_user_id),
        friend_email=friend.email,
        nickname=contact.nickname,
        created_at=contact.created_at
    )


@app.delete("/contacts/{contact_id}", response_model=MessageResponse)
async def delete_contact(
    contact_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Delete a contact
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        contact_uuid = uuid_lib.UUID(contact_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find contact and verify ownership
    contact = db.query(Contact).filter(
        Contact.id == contact_uuid,
        Contact.user_id == user_id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    db.delete(contact)
    db.commit()
    
    return MessageResponse(message="Contact deleted successfully")


# ==================== Contact Group Routes ====================

@app.post("/contact-groups", response_model=ContactGroupResponse)
async def create_contact_group(
    request: CreateContactGroupRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Create a new contact group
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Verify all contact IDs belong to the user
    if request.contact_ids:
        contacts = db.query(Contact).filter(
            Contact.id.in_([uuid_lib.UUID(str(cid)) for cid in request.contact_ids]),
            Contact.user_id == user_id
        ).all()
        if len(contacts) != len(request.contact_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more contacts not found or not owned by user"
            )
    
    # Create group
    group = ContactGroup(
        user_id=user_id,
        name=request.name,
        description=request.description
    )
    db.add(group)
    db.flush()
    
    # Add members
    for contact_id in request.contact_ids:
        member = ContactGroupMember(
            group_id=group.id,
            contact_id=uuid_lib.UUID(str(contact_id))
        )
        db.add(member)
    
    db.commit()
    db.refresh(group)
    
    # Get creator (user who created the group)
    creator = db.query(User).filter(User.id == group.user_id).first()
    
    # Build response - always include creator first
    members = []
    if creator:
        members.append(ContactGroupMemberSchema(
            contact_id=None,
            user_id=creator.id,
            contact_email=creator.email,
            contact_nickname=None,
            is_creator=True
        ))
    
    # Add other members (contacts)
    members_query = db.query(ContactGroupMember, Contact, User).join(
        Contact, ContactGroupMember.contact_id == Contact.id
    ).join(
        User, Contact.friend_user_id == User.id
    ).filter(ContactGroupMember.group_id == group.id).all()
    
    for member, contact, friend_user in members_query:
        members.append(ContactGroupMemberSchema(
            contact_id=contact.id,
            user_id=friend_user.id,
            contact_email=friend_user.email,
            contact_nickname=contact.nickname,
            is_creator=False
        ))
    
    return ContactGroupResponse(
        id=group.id,
        user_id=group.user_id,
        name=group.name,
        description=group.description,
        members=members,
        member_count=len(members),
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@app.get("/contact-groups", response_model=ContactGroupListResponse)
async def get_contact_groups(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get user's contact groups
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Get ALL groups (shared across all users)
    groups = db.query(ContactGroup).order_by(ContactGroup.created_at.desc()).all()
    
    group_responses = []
    for group in groups:
        # Get creator (user who created the group)
        creator = db.query(User).filter(User.id == group.user_id).first()
        
        # Build members list - always include creator first
        members = []
        if creator:
            members.append(ContactGroupMemberSchema(
                contact_id=None,
                user_id=creator.id,
                contact_email=creator.email,
                contact_nickname=None,
                is_creator=True
            ))
        
        # Add other members (contacts)
        members_query = db.query(ContactGroupMember, Contact, User).join(
            Contact, ContactGroupMember.contact_id == Contact.id
        ).join(
            User, Contact.friend_user_id == User.id
        ).filter(ContactGroupMember.group_id == group.id).all()
        
        for member, contact, friend_user in members_query:
            members.append(ContactGroupMemberSchema(
                contact_id=contact.id,
                user_id=friend_user.id,
                contact_email=friend_user.email,
                contact_nickname=contact.nickname,
                is_creator=False
            ))
        
        group_responses.append(ContactGroupResponse(
            id=group.id,
            user_id=group.user_id,
            name=group.name,
            description=group.description,
            members=members,
            member_count=len(members),
            created_at=group.created_at,
            updated_at=group.updated_at
        ))
    
    return ContactGroupListResponse(groups=group_responses, total=len(group_responses))


@app.put("/contact-groups/{group_id}", response_model=ContactGroupResponse)
async def update_contact_group(
    group_id: str,
    request: UpdateContactGroupRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Update a contact group
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        group_uuid = uuid_lib.UUID(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find group (all users can view, but only creator can update)
    group = db.query(ContactGroup).filter(
        ContactGroup.id == group_uuid
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Only creator can update
    if group.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group creator can update this group"
        )
    
    # Update group fields
    if request.name is not None:
        group.name = request.name
    if request.description is not None:
        group.description = request.description
    
    # Update members if provided
    if request.contact_ids is not None:
        # Verify all contact IDs belong to the user
        if request.contact_ids:
            contacts = db.query(Contact).filter(
                Contact.id.in_([uuid_lib.UUID(str(cid)) for cid in request.contact_ids]),
                Contact.user_id == user_id
            ).all()
            if len(contacts) != len(request.contact_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more contacts not found or not owned by user"
                )
        
        # Delete existing members (only non-creator members)
        db.query(ContactGroupMember).filter(ContactGroupMember.group_id == group.id).delete()
        
        # Add new members (creator is automatically included, not in contact_ids)
        for contact_id in request.contact_ids:
            if contact_id:  # Ensure contact_id is not None or empty
                member = ContactGroupMember(
                    group_id=group.id,
                    contact_id=uuid_lib.UUID(str(contact_id))
                )
                db.add(member)
    
    db.commit()
    db.refresh(group)
    
    # Get creator (user who created the group)
    creator = db.query(User).filter(User.id == group.user_id).first()
    
    # Build response - always include creator first
    members = []
    if creator:
        members.append(ContactGroupMemberSchema(
            contact_id=None,
            user_id=creator.id,
            contact_email=creator.email,
            contact_nickname=None,
            is_creator=True
        ))
    
    # Add other members (contacts)
    members_query = db.query(ContactGroupMember, Contact, User).join(
        Contact, ContactGroupMember.contact_id == Contact.id
    ).join(
        User, Contact.friend_user_id == User.id
    ).filter(ContactGroupMember.group_id == group.id).all()
    
    for member, contact, friend_user in members_query:
        members.append(ContactGroupMemberSchema(
            contact_id=contact.id,
            user_id=friend_user.id,
            contact_email=friend_user.email,
            contact_nickname=contact.nickname,
            is_creator=False
        ))
    
    return ContactGroupResponse(
        id=group.id,
        user_id=group.user_id,
        name=group.name,
        description=group.description,
        members=members,
        member_count=len(members),
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@app.delete("/contact-groups/{group_id}", response_model=MessageResponse)
async def delete_contact_group(
    group_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Delete a contact group
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        group_uuid = uuid_lib.UUID(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find group (all users can view, but only creator can delete)
    group = db.query(ContactGroup).filter(
        ContactGroup.id == group_uuid
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Only creator can delete
    if group.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group creator can delete this group"
        )
    
    # Delete group (cascade will delete members)
    db.delete(group)
    db.commit()
    
    return MessageResponse(message="Group deleted successfully")


# ==================== Expense Split Routes ====================

@app.post("/expenses/{expense_id}/splits", response_model=MessageResponse)
async def create_expense_splits(
    expense_id: str,
    request: CreateExpenseSplitRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Create expense splits for an expense
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        expense_uuid = uuid_lib.UUID(expense_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify expense ownership
    expense = db.query(Expense).filter(
        Expense.id == expense_uuid,
        Expense.user_id == user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Create splits
    for participant in request.participants:
        # If contact_id provided, get email
        participant_email = participant.email
        contact_id = None
        
        if participant.contact_id:
            try:
                contact_uuid = uuid_lib.UUID(participant.contact_id)
                contact = db.query(Contact).filter(
                    Contact.id == contact_uuid,
                    Contact.user_id == user_id
                ).first()
                if contact:
                    friend = db.query(User).filter(User.id == contact.friend_user_id).first()
                    if friend:
                        participant_email = friend.email
                        contact_id = contact_uuid
            except (ValueError, TypeError):
                pass
        
        split = ExpenseSplit(
            expense_id=expense_uuid,
            participant_name=participant.name,
            participant_email=participant_email,
            contact_id=contact_id,
            amount_owed=Decimal(str(participant.amount_owed)),
            items_detail=json.dumps(participant.items_detail) if participant.items_detail else None
        )
        db.add(split)
    
    db.commit()
    
    return MessageResponse(message="Expense splits created successfully")


@app.get("/expenses/{expense_id}/splits", response_model=ExpenseSplitListResponse)
async def get_expense_splits(
    expense_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get expense splits for an expense
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        expense_uuid = uuid_lib.UUID(expense_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify expense ownership
    expense = db.query(Expense).filter(
        Expense.id == expense_uuid,
        Expense.user_id == user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Get splits
    splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense_uuid).all()
    
    split_responses = []
    for split in splits:
        split_responses.append(ExpenseSplitResponse(
            id=str(split.id),
            expense_id=str(split.expense_id),
            participant_name=split.participant_name,
            participant_email=split.participant_email,
            contact_id=str(split.contact_id) if split.contact_id else None,
            amount_owed=float(split.amount_owed),
            items_detail=split.items_detail,
            is_paid=split.is_paid,
            email_sent=split.email_sent,
            email_sent_at=split.email_sent_at,
            created_at=split.created_at
        ))
    
    return ExpenseSplitListResponse(splits=split_responses, total=len(split_responses))


@app.post("/expenses/{expense_id}/send-bills", response_model=SendBillResponse)
async def send_bills_to_participants(
    expense_id: str,
    request: SendBillRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Send bill emails to selected participants
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
    try:
        user_id = uuid_lib.UUID(user_id_str)
        expense_uuid = uuid_lib.UUID(expense_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify expense ownership
    expense = db.query(Expense).filter(
        Expense.id == expense_uuid,
        Expense.user_id == user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Get payer (user) info
    payer = db.query(User).filter(User.id == user_id).first()
    payer_name = payer.email.split('@')[0] if payer else "Your friend"
    
    # Prepare expense data
    expense_data = {
        'store_name': expense.store_name or "Unknown",
        'total': float(expense.total_amount),
        'date': expense.created_at.strftime("%B %d, %Y") if expense.created_at else "Recent"
    }
    
    sent_count = 0
    failed_count = 0
    results = []
    
    # Send emails to selected participants
    for split_id_str in request.participant_ids:
        try:
            split_id = uuid_lib.UUID(split_id_str)
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.id == split_id,
                ExpenseSplit.expense_id == expense_uuid
            ).first()
            
            if not split:
                results.append({
                    "participant_id": split_id_str,
                    "participant_name": "Unknown",
                    "status": "failed",
                    "message": "Split not found"
                })
                failed_count += 1
                continue
            
            if not split.participant_email:
                results.append({
                    "participant_id": split_id_str,
                    "participant_name": split.participant_name,
                    "status": "failed",
                    "message": "No email address"
                })
                failed_count += 1
                continue
            
            # Prepare split data
            items_detail = json.loads(split.items_detail) if split.items_detail else []
            split_data = {
                'amount_owed': float(split.amount_owed),
                'items_detail': items_detail
            }
            
            # Send email
            success = await send_split_bill_email(
                to_email=split.participant_email,
                to_name=split.participant_name,
                payer_name=payer_name,
                expense_data=expense_data,
                split_data=split_data
            )
            
            if success:
                # Update split record
                split.email_sent = True
                split.email_sent_at = datetime.utcnow()
                sent_count += 1
                results.append({
                    "participant_id": split_id_str,
                    "participant_name": split.participant_name,
                    "status": "sent",
                    "message": f"Email sent to {split.participant_email}"
                })
            else:
                failed_count += 1
                results.append({
                    "participant_id": split_id_str,
                    "participant_name": split.participant_name,
                    "status": "failed",
                    "message": "Failed to send email"
                })
        
        except Exception as e:
            failed_count += 1
            results.append({
                "participant_id": split_id_str,
                "participant_name": "Unknown",
                "status": "error",
                "message": str(e)
            })
    
    db.commit()
    
    return SendBillResponse(
        sent_count=sent_count,
        failed_count=failed_count,
        results=results
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6000)

