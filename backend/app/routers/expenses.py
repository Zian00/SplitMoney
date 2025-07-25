from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete
from typing import List
from app.database import get_session
from app.deps import get_current_user
from app.models import Expense, ExpensePayer, ExpenseShare, Group, Membership, User
from app.schemas import ExpenseWithDetailsOut
from collections import defaultdict

router = APIRouter()

# Get all expenses for the current user across all their groups
@router.get("/expenses", response_model=List[ExpenseWithDetailsOut])
async def get_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user_group_ids = session.exec(
        select(Membership.group_id).where(Membership.user_id == current_user.id)
    ).all()

    if not user_group_ids:
        return []

    expenses = session.exec(
        select(Expense).where(Expense.group_id.in_(user_group_ids))
    ).all()
    expense_ids = [exp.id for exp in expenses]

    payers = session.exec(
        select(ExpensePayer).where(ExpensePayer.expense_id.in_(expense_ids))
    ).all()
    shares = session.exec(
        select(ExpenseShare).where(ExpenseShare.expense_id.in_(expense_ids))
    ).all()

    payers_by_expense = defaultdict(list)
    for p in payers:
        payers_by_expense[p.expense_id].append(p.model_dump())

    shares_by_expense = defaultdict(list)
    for s in shares:
        shares_by_expense[s.expense_id].append(s.model_dump())

    result = []
    for exp in expenses:
        result.append({
            "id": exp.id,
            "group_id": exp.group_id,
            "description": exp.description,
            "type": exp.type,
            "total_amount": exp.total_amount,
            "created_at": exp.created_at.isoformat(),
            "payers": payers_by_expense[exp.id],
            "shares": shares_by_expense[exp.id],
        })
    return result

# Get expenses for a specific group
@router.get("/groups/{group_id}/expenses", response_model=List[Expense])
async def get_group_expenses(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Security check: ensure user is a member of the group they're requesting
    membership = session.exec(
        select(Membership).where(
            Membership.group_id == group_id,
            Membership.user_id == current_user.id
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    statement = select(Expense).where(Expense.group_id == group_id)
    expenses = session.exec(statement).all()
    return expenses

# Create a new expense
@router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: dict, session: Session = Depends(get_session)):
    # Validate group exists
    group = session.get(Group, expense_data["group_id"])
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Create expense
    expense = Expense(
        group_id=expense_data["group_id"],
        description=expense_data.get("description", ""),
        total_amount=expense_data["total_amount"]
    )
    
    session.add(expense)
    session.commit()
    session.refresh(expense)
    
    # Add payers
    for payer_data in expense_data.get("payers", []):
        payer = ExpensePayer(
            expense_id=expense.id,
            user_id=payer_data["user_id"],
            paid_amount=payer_data["paid_amount"]
        )
        session.add(payer)
    
    # Add shares
    for share_data in expense_data.get("shares", []):
        share = ExpenseShare(
            expense_id=expense.id,
            user_id=share_data["user_id"],
            share_amount=share_data["share_amount"]
        )
        session.add(share)
    
    session.commit()
    session.refresh(expense)
    return expense

# Get a specific expense
@router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

# Update an expense
@router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: int, expense_data: dict, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update basic fields
    if "description" in expense_data:
        expense.description = expense_data["description"]
    if "total_amount" in expense_data:
        expense.total_amount = expense_data["total_amount"]
    
    # Update payers (delete existing and add new)
    existing_payers = session.exec(select(ExpensePayer).where(ExpensePayer.expense_id == expense_id)).all()
    for payer in existing_payers:
        session.delete(payer)
    
    for payer_data in expense_data.get("payers", []):
        payer = ExpensePayer(
            expense_id=expense_id,
            user_id=payer_data["user_id"],
            paid_amount=payer_data["paid_amount"]
        )
        session.add(payer)
    
    # Update shares (delete existing and add new)
    existing_shares = session.exec(select(ExpenseShare).where(ExpenseShare.expense_id == expense_id)).all()
    for share in existing_shares:
        session.delete(share)
    
    for share_data in expense_data.get("shares", []):
        share = ExpenseShare(
            expense_id=expense_id,
            user_id=share_data["user_id"],
            share_amount=share_data["share_amount"]
        )
        session.add(share)
    
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense

# Delete an expense
@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete related payers and shares first
    session.exec(delete(ExpensePayer).where(ExpensePayer.expense_id == expense_id))
    session.exec(delete(ExpenseShare).where(ExpenseShare.expense_id == expense_id))
    
    # Delete the expense
    session.delete(expense)
    session.commit()
    
    return {"message": "Expense deleted successfully"}

# Get expense details with payers and shares
@router.get("/expenses/{expense_id}/details")
async def get_expense_details(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Get payers
    payers = session.exec(select(ExpensePayer).where(ExpensePayer.expense_id == expense_id)).all()
    
    # Get shares
    shares = session.exec(select(ExpenseShare).where(ExpenseShare.expense_id == expense_id)).all()
    
    return {
        "expense": expense,
        "payers": payers,
        "shares": shares
    } 