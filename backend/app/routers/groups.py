from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlmodel import Session, select, delete
from typing import List
from app.database import get_session
from app.deps import get_current_user
from app.models import Group, User, Membership, UserCreate, Expense, ExpensePayer, ExpenseShare, GroupInvitation
from app.schemas import Debt, UserInfo # Import new schemas
from sqlalchemy.orm import selectinload
from app.mail_utils import fast_mail
from fastapi_mail import MessageSchema
from datetime import datetime, timezone, timedelta
import secrets
from pathlib import Path
router = APIRouter()

# Get all groups for the current user
@router.get("/groups", response_model=List[Group])
async def get_groups(
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    # Get groups where the current user is a member
    statement = select(Group).join(Membership).where(
        Membership.user_id == current_user.id
    )
    groups = session.exec(statement).all()
    return groups


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
                "name": user.name,
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

# Get summary for the group
@router.get("/groups/{group_id}/summary", response_model=List[Debt])
async def get_group_summary(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure the user is a member of the group
    membership = session.exec(
        select(Membership).where(
            Membership.group_id == group_id,
            Membership.user_id == current_user.id
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # 1. Calculate balances for each member
    balances = {}
    members = session.exec(select(User).join(Membership).where(Membership.group_id == group_id)).all()
    for member in members:
        balances[member.id] = 0

    expenses = session.exec(
        select(Expense)
        .where(Expense.group_id == group_id)
        .options(selectinload(Expense.payers), selectinload(Expense.shares))
    ).all()

    for expense in expenses:
        for payer in expense.payers:
            if payer.user_id in balances:
                balances[payer.user_id] += payer.paid_amount
        for share in expense.shares:
            if share.user_id in balances:
                balances[share.user_id] -= share.share_amount

    # 2. Separate into debtors and creditors
    debtors = {}
    creditors = {}

    for user_id, balance in balances.items():
        if balance < -0.01:
            debtors[user_id] = balance
        elif balance > 0.01:
            creditors[user_id] = balance
    
    # 3. Simplify debts
    transactions = []
    while debtors and creditors:
        debtor_id, debt = min(debtors.items(), key=lambda item: item[1])
        creditor_id, credit = max(creditors.items(), key=lambda item: item[1])

        amount = min(abs(debt), credit)

        transactions.append({
            "from_user_id": debtor_id,
            "to_user_id": creditor_id,
            "amount": amount
        })

        debtors[debtor_id] += amount
        creditors[creditor_id] -= amount

        if abs(debtors[debtor_id]) < 0.01:
            del debtors[debtor_id]
        if abs(creditors[creditor_id]) < 0.01:
            del creditors[creditor_id]

    # 4. Format the response with user names
    response_debts = []
    member_map = {member.id: member for member in members}
    for t in transactions:
        from_user = member_map.get(t["from_user_id"])
        to_user = member_map.get(t["to_user_id"])
        if from_user and to_user:
            response_debts.append(
                Debt(
                    from_user=UserInfo(id=from_user.id, name=from_user.name),
                    to_user=UserInfo(id=to_user.id, name=to_user.name),
                    amount=t["amount"]
                )
            )

    return response_debts

@router.post("/groups/{group_id}/invite")
async def invite_user_to_group(
    group_id: int,
    background_tasks: BackgroundTasks,
    data: dict = Body(...),  # expects {"email": "invitee@example.com"}
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    invitee_email = data.get("email")
    if not invitee_email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Check if group exists
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # This is the important part. By accessing group.creator here, we ensure the relationship is loaded
    # before the background task runs and the session is closed.
    creator_name = group.creator.name

    # Generate token and expiration
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=1)

    # Store invitation
    invitation = GroupInvitation(
        group_id=group_id,
        invitee_email=invitee_email,
        token=token,
        expires_at=expires_at
    )
    session.add(invitation)
    session.commit()

    # --- Send HTML email in background ---
    invite_link = f"http://localhost:3000/invite/{token}"
    
    # Read the HTML template
    template_path = Path(__file__).parent.parent / "templates" / "invitation.html"
    with open(template_path, "r") as f:
        template_str = f.read()
    
    # Populate the template
    body = template_str.replace("{{ creator_name }}", creator_name)
    body = body.replace("{{ group_name }}", group.name)
    body = body.replace("{{ invite_link }}", invite_link)

    message = MessageSchema(
        subject="You're invited to join a SplitMoney group!",
        recipients=[invitee_email],
        body=body,
        subtype="html"
    )
    background_tasks.add_task(fast_mail.send_message, message)

    return {"message": "Invitation sent successfully."}

@router.get("/invites/accept/{token}")
async def accept_invitation_from_link(
    token: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    This endpoint is designed to be hit from a browser link (GET request).
    """
    invitation = session.exec(
        select(GroupInvitation).where(GroupInvitation.token == token)
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or invalid.")
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Invitation has already been used.")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired.")
    if current_user.email != invitation.invitee_email:
        raise HTTPException(status_code=403, detail="This invitation is for a different user.")

    # Add user to group if not already a member
    existing_membership = session.exec(
        select(Membership).where(
            Membership.user_id == current_user.id,
            Membership.group_id == invitation.group_id
        )
    ).first()

    if not existing_membership:
        membership = Membership(user_id=current_user.id, group_id=invitation.group_id)
        session.add(membership)

    invitation.status = "accepted"
    session.add(invitation)
    session.commit()
    return {"message": "You have successfully joined the group!", "group_id": invitation.group_id}