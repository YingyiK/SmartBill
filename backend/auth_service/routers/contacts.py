"""
Contact and Contact Group Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
import uuid as uuid_lib

from dependencies import get_db, get_current_user
from models import User, Contact, ContactGroup, ContactGroupMember
from contact_schemas import AddContactRequest, UpdateContactRequest, ContactResponse, ContactListResponse
from contact_group_schemas import (
    CreateContactGroupRequest,
    UpdateContactGroupRequest,
    ContactGroupResponse,
    ContactGroupListResponse,
    ContactGroupMemberSchema
)
from schemas import MessageResponse

router = APIRouter()

# ==================== Contact/Friend Management Routes ====================

@router.post("/contacts", response_model=ContactResponse)
async def add_contact(
    request: AddContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a friend to contacts (must be a registered user)
    """
    # Find friend by email
    friend = db.query(User).filter(User.email == request.friend_email.lower()).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email is not registered"
        )
    
    # Check if trying to add self
    if friend.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as a contact"
        )
    
    # Check if already in contacts
    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.friend_user_id == friend.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is already in your contacts"
        )
    
    # Create contact (A -> B)
    contact = Contact(
        user_id=current_user.id,
        friend_user_id=friend.id,
        nickname=request.nickname
    )
    db.add(contact)
    
    # Auto-create reverse contact (B -> A) if not exists
    # B's nickname for A should be default (email username)
    reverse_existing = db.query(Contact).filter(
        Contact.user_id == friend.id,
        Contact.friend_user_id == current_user.id
    ).first()
    
    if not reverse_existing:
        # Default nickname is email username (before @)
        default_nickname = current_user.email.split('@')[0]
        reverse_contact = Contact(
            user_id=friend.id,
            friend_user_id=current_user.id,
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


@router.get("/contacts", response_model=ContactListResponse)
async def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's contact list
    """
    # Get contacts with friend info
    contacts = (
        db.query(Contact)
        .options(selectinload(Contact.friend_user))
        .filter(Contact.user_id == current_user.id)
        .all()
    )
    
    contact_responses = []
    for contact in contacts:
        if contact.friend_user:
            contact_responses.append(ContactResponse(
                id=str(contact.id),
                user_id=str(contact.user_id),
                friend_user_id=str(contact.friend_user_id),
                friend_email=contact.friend_user.email,
                nickname=contact.nickname,
                created_at=contact.created_at
            ))
    
    return ContactListResponse(contacts=contact_responses, total=len(contact_responses))


@router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    request: UpdateContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a contact's nickname
    """
    try:
        contact_uuid = uuid_lib.UUID(contact_id)
    except (ValueError, TypeError):
            raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify contact ownership
    contact = db.query(Contact).filter(
        Contact.id == contact_uuid,
        Contact.user_id == current_user.id
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


@router.delete("/contacts/{contact_id}", response_model=MessageResponse)
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a contact
    """
    try:
        contact_uuid = uuid_lib.UUID(contact_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Find contact and verify ownership
    contact = db.query(Contact).filter(
        Contact.id == contact_uuid,
        Contact.user_id == current_user.id
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

@router.post("/contact-groups", response_model=ContactGroupResponse)
async def create_contact_group(
    request: CreateContactGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new contact group
    """
    # Verify all contact IDs belong to the user
    if request.contact_ids:
        contacts = db.query(Contact).filter(
            Contact.id.in_([uuid_lib.UUID(str(cid)) for cid in request.contact_ids]),
            Contact.user_id == current_user.id
        ).all()
        if len(contacts) != len(request.contact_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more contacts not found or not owned by user"
            )
    
    # Create group
    group = ContactGroup(
        user_id=current_user.id,
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


@router.get("/contact-groups", response_model=ContactGroupListResponse)
async def get_contact_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's contact groups
    """
    # Get user's groups
    groups = (
        db.query(ContactGroup)
        .options(
            selectinload(ContactGroup.members).selectinload(ContactGroupMember.contact).selectinload(Contact.friend_user)
        )
        .filter(ContactGroup.user_id == current_user.id)
        .order_by(ContactGroup.created_at.desc())
        .all()
    )
    
    group_responses = []
    for group in groups:
        # Get creator (user who created the group)
        # For user's own groups, creator IS current_user
        creator = current_user
        
        # Build members list - always include creator first
        members = []
        members.append(ContactGroupMemberSchema(
            contact_id=None,
            user_id=creator.id,
            contact_email=creator.email,
            contact_nickname=None,
            is_creator=True
        ))
        
        # Add other members (contacts)
        for member in group.members:
            if member.contact and member.contact.friend_user:
                members.append(ContactGroupMemberSchema(
                    contact_id=member.contact.id,
                    user_id=member.contact.friend_user.id,
                    contact_email=member.contact.friend_user.email,
                    contact_nickname=member.contact.nickname,
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


@router.put("/contact-groups/{group_id}", response_model=ContactGroupResponse)
async def update_contact_group(
    group_id: str,
    request: UpdateContactGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a contact group
    """
    try:
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
    if group.user_id != current_user.id:
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
                Contact.user_id == current_user.id
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


@router.delete("/contact-groups/{group_id}", response_model=MessageResponse)
async def delete_contact_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a contact group
    """
    try:
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
    if group.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group creator can delete this group"
        )
    
    # Delete group (cascade will delete members)
    db.delete(group)
    db.commit()
    
    return MessageResponse(message="Group deleted successfully")

