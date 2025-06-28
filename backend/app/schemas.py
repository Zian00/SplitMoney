from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import re

class GroupCreate(BaseModel):
    email: str
    name: str 
    created_by: int

class ExpenseCreate(BaseModel):
    group_id: int
    description: Optional[str] = None
    total_amount: float
    payers: List[dict]  # [{"user_id": 1, "paid_amount": 50.0}]
    shares: List[dict]  # [{"user_id": 1, "share_amount": 25.0}]

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    total_amount: Optional[float] = None 

# Add these new models for the summary response
class UserInfo(BaseModel):
    id: int
    name: str

class Debt(BaseModel):
    from_user: UserInfo
    to_user: UserInfo
    amount: float

class UserCreate(BaseModel):
    email: str
    password: str

    @field_validator('password')
    @classmethod
    def password_strong(cls, v):
        if (len(v) < 8 or
            not re.search(r'[A-Z]', v) or
            not re.search(r'[a-z]', v) or
            not re.search(r'\d', v)):
            raise ValueError('Password must be at least 8 characters and include uppercase, lowercase, and a digit.')
        return v

class ExpensePayerOut(BaseModel):
    id: int
    expense_id: int
    user_id: int
    paid_amount: float

class ExpenseShareOut(BaseModel):
    id: int
    expense_id: int
    user_id: int
    share_amount: float

class ExpenseWithDetailsOut(BaseModel):
    id: int
    group_id: int
    description: str = None
    type: str
    total_amount: float
    created_at: str
    payers: List[ExpensePayerOut]
    shares: List[ExpenseShareOut]