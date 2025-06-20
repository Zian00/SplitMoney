from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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