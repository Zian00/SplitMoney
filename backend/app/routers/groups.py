from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Group, User, Membership, UserCreate

router = APIRouter()

# Get all groups
@router.get("/groups", response_model=List[Group])
async def get_groups(session: Session = Depends(get_session)):
    statement = select(Group)
    groups = session.exec(statement).all()
    return groups

# Get groups for a specific user
@router.get("/users/{user_id}/groups", response_model=List[Group])
async def get_user_groups(user_id: int, session: Session = Depends(get_session)):
    try:
        # Get groups where user is a member
        statement = select(Group).join(Membership).where(Membership.user_id == user_id)
        groups = session.exec(statement).all()
        print(f"Found {len(groups)} groups for user {user_id}")  # Debug print
        return groups
    except Exception as e:
        print(f"Error getting user groups: {e}")  # Debug print
        raise HTTPException(status_code=500, detail="Failed to get user groups")

# Create a new group
@router.post("/groups", response_model=Group)
async def create_group(group_data: dict, session: Session = Depends(get_session)):
    # For now, we'll use a simple dict. You can create a GroupCreate model later
    group = Group(
        name=group_data["name"],
        created_by=group_data["created_by"]
    )
    
    session.add(group)
    session.commit()
    session.refresh(group)
    
    # Add creator as a member
    membership = Membership(
        user_id=group_data["created_by"],
        group_id=group.id
    )
    session.add(membership)
    session.commit()
    
    return group

# Get a specific group
@router.get("/groups/{group_id}", response_model=Group)
async def get_group(group_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

# Add user to group
@router.post("/groups/{group_id}/members")
async def add_member(group_id: int, user_data: dict, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user exists
    user = session.get(User, user_data["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing_membership = session.exec(
        select(Membership).where(
            Membership.user_id == user_data["user_id"],
            Membership.group_id == group_id
        )
    ).first()
    
    if existing_membership:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    membership = Membership(
        user_id=user_data["user_id"],
        group_id=group_id
    )
    session.add(membership)
    session.commit()
    
    return {"message": "User added to group successfully"}

# Remove user from group
@router.delete("/groups/{group_id}/members/{user_id}")
async def remove_member(group_id: int, user_id: int, session: Session = Depends(get_session)):
    membership = session.exec(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.group_id == group_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    session.delete(membership)
    session.commit()
    
    return {"message": "User removed from group successfully"} 