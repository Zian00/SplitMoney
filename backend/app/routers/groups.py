from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session, select, delete
from typing import List
from app.database import get_session
from app.models import Group, User, Membership, UserCreate
from app.deps import get_current_user

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
        statement = select(Group).join(Membership).where(
            Membership.user_id == user_id)
        groups = session.exec(statement).all()
        print(f"Found {len(groups)} groups for user {user_id}")  # Debug print
        return groups
    except Exception as e:
        print(f"Error getting user groups: {e}")  # Debug print
        raise HTTPException(
            status_code=500, detail="Failed to get user groups")


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

# Add user to group by email
@router.post("/groups/{group_id}/add-member")
async def add_member_by_email(group_id: int, member_data: dict, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Find user by email
    user = session.exec(select(User).where(
        User.email == member_data["email"])).first()
    if not user:
        raise HTTPException(
            status_code=404, detail="User with this email not found")

    # Check if already a member
    existing_membership = session.exec(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.group_id == group_id
        )
    ).first()

    if existing_membership:
        raise HTTPException(
            status_code=400, detail="User is already a member of this group")

    # Add membership
    membership = Membership(
        user_id=user.id,
        group_id=group_id
    )
    session.add(membership)
    session.commit()

    return {
        "message": f"User {user.email} added to group successfully",
        "user": {
            "id": user.id,
            "email": user.email
        }
    }

# Get group members
@router.get("/groups/{group_id}/members")
async def get_group_members(group_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Get all members of the group
    memberships = session.exec(
        select(Membership).where(Membership.group_id == group_id)
    ).all()

    members = []
    for membership in memberships:
        user = session.get(User, membership.user_id)
        if user:
            members.append({
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at
            })

    return {"members": members}

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

# Edit group by creator (already present, just ensure get_current_user is implemented)
@router.put("/groups/{group_id}", response_model=Group)
async def update_group(
    group_id: int,
    group_data: dict = Body(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this group")
    if "name" in group_data:
        group.name = group_data["name"]
    session.add(group)
    session.commit()
    session.refresh(group)
    return group

# Delete group by creator
@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Fetch the group
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Authorization check
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this group")

    # Delete related memberships
    session.exec(
        delete(Membership).where(Membership.group_id == group_id)
    )

    # Delete the group
    session.delete(group)
    session.commit()

    return {"message": "Group deleted successfully"}