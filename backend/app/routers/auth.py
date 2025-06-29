from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session, select
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, UserCreate
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from app.auth_utils import create_access_token
from app.config import settings
from app.deps import get_current_user
import re

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get user by email
def get_user_by_email(session: Session, email: str):
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

# Register endpoint
@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    try:
        print(f"Registering user: {user_data.email}")  # Debug log
        db_user = get_user_by_email(session, user_data.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Extract name from email
        name = user_data.email.split("@")[0]
        # Create new user with hashed password
        user = User(
            email=user_data.email,
            name=name,
            password_hash=pwd_context.hash(user_data.password)
        )

        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User registered successfully: {user.id}")  # Debug log
        return user
    except Exception as e:
        print(f"Registration error: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.put("/users/me/name")
async def update_user_name(
    data: dict = Body(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    new_name = data.get("name")
    if not new_name:
        raise HTTPException(status_code=400, detail="Name is required")
    current_user.name = new_name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {"message": "Name updated successfully", "name": current_user.name}

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
        raise HTTPException(
            status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/users/me/password")
async def change_password(
    data: dict = Body(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    new_password = data.get("new_password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")
    
    # Validate password strength
    if (len(new_password) < 8 or
        not re.search(r'[A-Z]', new_password) or
        not re.search(r'[a-z]', new_password) or
        not re.search(r'\d', new_password)):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters and include uppercase, lowercase, and a digit.")
    
    # Update password
    current_user.password_hash = pwd_context.hash(new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password updated successfully"}
