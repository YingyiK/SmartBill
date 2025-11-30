"""
Database models for authentication service
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class EmailVerificationCode(Base):
    __tablename__ = "email_verification_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    store_name = Column(String(255))
    total_amount = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2))
    tax_amount = Column(Numeric(10, 2))
    tax_rate = Column(Numeric(5, 4))
    raw_text = Column(String, nullable=True)  # OCR raw text
    transcript = Column(String, nullable=True)  # Voice transcript
    receipt_image_url = Column(String, nullable=True)  # Optional: image storage URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    items = Column(String, nullable=True)  # JSON string of items
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Group(Base):
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)  # Optional email for future use
    created_at = Column(DateTime(timezone=True), server_default=func.now())

