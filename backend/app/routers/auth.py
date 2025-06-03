from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from passlib.context import CryptContext
from app.database import get_session
from app.models import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get user by email
def get_user_by_email(session: Session, email: str):
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

# Register endpoint
@router.post("/register", response_model=User)
async def register_user(user: User, session: Session = Depends(get_session)):
    db_user = get_user_by_email(session, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user.password_hash = pwd_context.hash(user.password_hash)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# Get user by id
@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 