from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, UserCreate
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from app.auth_utils import create_access_token
from app.config import settings


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get user by email
def get_user_by_email(session: Session, email: str):
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

# Register endpoint
@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    db_user = get_user_by_email(session, user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with hashed password
    user = User(
        email=user_data.email,
        password_hash=pwd_context.hash(user_data.password)
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# Login endpoint
@router.post("/login")
async def login_user(user_data: UserCreate, session: Session = Depends(get_session)):
    print("=== LOGIN ENDPOINT CALLED ===")
    print(f"Login attempt for: {user_data.email}")
    
    # Find user by email
    user = get_user_by_email(session, user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not pwd_context.verify(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
 
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at
        }
    }

# Get user by id
@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = get_user_by_email(session, form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}