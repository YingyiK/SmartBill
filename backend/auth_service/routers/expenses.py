"""
Expense Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
import uuid as uuid_lib
import json

from dependencies import get_db, get_current_user
from models import User, Expense, ExpenseItem, ExpenseParticipant, ExpenseSplit
from expense_schemas import (
    CreateExpenseRequest, 
    ExpenseResponse, 
    ExpenseListResponse, 
    ExpenseItemSchema, 
    ExpenseParticipantSchema
)
from schemas import MessageResponse

router = APIRouter()

@router.post("", response_model=ExpenseResponse)
async def create_expense(
    request: CreateExpenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new expense
    """
    # Create expense
    expense = Expense(
        user_id=current_user.id,
        store_name=request.store_name,
        total_amount=request.total_amount,
        subtotal=request.subtotal,
        tax_amount=request.tax_amount,
        tax_rate=request.tax_rate,
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
            price=item_data.price,
            quantity=item_data.quantity
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
        total_amount=expense.total_amount,
        subtotal=expense.subtotal,
        tax_amount=expense.tax_amount,
        tax_rate=expense.tax_rate,
        raw_text=expense.raw_text,
        transcript=expense.transcript,
        items=[
            ExpenseItemSchema(name=item.name, price=item.price, quantity=item.quantity)
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


@router.get("", response_model=ExpenseListResponse)
async def get_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's expenses
    """
    # Get expenses
    expenses = (
        db.query(Expense)
        .options(
            selectinload(Expense.items),
            selectinload(Expense.participants)
        )
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    total = db.query(Expense).filter(Expense.user_id == current_user.id).count()
    
    expense_responses = []
    for expense in expenses:
        expense_responses.append(ExpenseResponse(
            id=str(expense.id),
            user_id=str(expense.user_id),
            store_name=expense.store_name,
            total_amount=expense.total_amount,
            subtotal=expense.subtotal,
            tax_amount=expense.tax_amount,
            tax_rate=expense.tax_rate,
            raw_text=expense.raw_text,
            transcript=expense.transcript,
            items=[
                ExpenseItemSchema(name=item.name, price=item.price, quantity=item.quantity)
                for item in expense.items
            ],
            participants=[
                ExpenseParticipantSchema(
                    name=p.name,
                    items=json.loads(p.items) if p.items else []
                )
                for p in expense.participants
            ],
            created_at=expense.created_at
        ))
    
    return ExpenseListResponse(expenses=expense_responses, total=total)


@router.delete("/{expense_id}", response_model=MessageResponse)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an expense
    """
    # Convert string UUID to UUID object
    try:
        expense_uuid = uuid_lib.UUID(expense_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find expense and verify ownership
    expense = db.query(Expense).filter(
        Expense.id == expense_uuid,
        Expense.user_id == current_user.id
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


@router.get("/shared-with-me", response_model=ExpenseListResponse)
async def get_shared_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    Get expenses where user is a participant (not creator)
    Shows bills that others have split with this user
    """
    # Find all expense splits where this user is a participant
    splits = db.query(ExpenseSplit).filter(
        ExpenseSplit.participant_email == current_user.email
    ).order_by(ExpenseSplit.created_at.desc()).limit(limit).offset(offset).all()
    
    # Get unique expense IDs
    expense_ids = list(set([split.expense_id for split in splits]))
    
    # Get expenses (but not created by this user)
    expenses = (
        db.query(Expense)
        .options(
            selectinload(Expense.items),
            selectinload(Expense.participants)
        )
        .filter(
            Expense.id.in_(expense_ids),
            Expense.user_id != current_user.id
        )
        .all()
    )
    
    expense_responses = []
    for expense in expenses:
        # use expense.items and expense.participants 
        expense_responses.append(ExpenseResponse(
            id=str(expense.id),
            user_id=str(expense.user_id),
            store_name=expense.store_name,
            total_amount=expense.total_amount,
            subtotal=expense.subtotal,
            tax_amount=expense.tax_amount,
            tax_rate=expense.tax_rate,
            raw_text=expense.raw_text,
            transcript=expense.transcript,
            items=[
                ExpenseItemSchema(name=item.name, price=item.price, quantity=item.quantity)
                for item in expense.items
            ],
            participants=[
                ExpenseParticipantSchema(
                    name=p.name,
                    items=json.loads(p.items) if p.items else []
                )
                for p in expense.participants
            ],
            created_at=expense.created_at
        ))
    
    return ExpenseListResponse(expenses=expense_responses, total=len(expense_responses))

