from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Expense, ExpensePayer, ExpenseShare, Group, User

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
    payers_statement = select(ExpensePayer).where(ExpensePayer.expense_id == expense_id)
    payers = session.exec(payers_statement).all()
    
    # Get shares
    shares_statement = select(ExpenseShare).where(ExpenseShare.expense_id == expense_id)
    shares = session.exec(shares_statement).all()
    
    return {
        "expense": expense,
        "payers": payers,
        "shares": shares
    } 