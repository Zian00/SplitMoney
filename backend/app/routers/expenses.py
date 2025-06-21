from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, delete
from typing import List
from app.database import get_session
from app.models import Expense, ExpensePayer, ExpenseShare, Group

router = APIRouter()

# Get all expenses
@router.get("/expenses", response_model=List[Expense])
async def get_expenses(session: Session = Depends(get_session)):
    statement = select(Expense)
    expenses = session.exec(statement).all()
    return expenses

# Get expenses for a specific group
@router.get("/groups/{group_id}/expenses", response_model=List[Expense])
async def get_group_expenses(group_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
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