from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session, select
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, UserCreate, PasswordResetToken
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
from app.auth_utils import create_access_token
from app.config import settings
from app.deps import get_current_user
from app.schemas import PasswordResetRequest, PasswordResetConfirm
import re
import secrets
from pathlib import Path
from fastapi import BackgroundTasks
from fastapi_mail import MessageSchema
from fastapi_mail import FastMail
from app.mail_utils import fast_mail

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

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    session: Session = Depends(get_session)
):
    """Request a password reset for the given email"""
    try:
        # Find user by email
        user = get_user_by_email(session, request.email)
        if not user:
            # Don't reveal if email exists or not for security
            return {"message": "If the email exists, a password reset link has been sent."}
        
        # Generate reset token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Invalidate any existing reset tokens for this user
        existing_tokens = session.exec(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False
            )
        ).all()
        
        for existing_token in existing_tokens:
            existing_token.used = True
            session.add(existing_token)
        
        # Create new reset token
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        session.add(reset_token)
        session.commit()
        
        # Send email with reset link
        reset_link = f"{settings.frontend_base_url}/reset-password/{token}"
        
        # Read the HTML template
        template_path = Path(__file__).parent.parent / "templates" / "password_reset.html"
        with open(template_path, "r", encoding="utf-8") as f:
            template_str = f.read()
        
        # Populate the template
        body = template_str.replace("{{ user_name }}", user.name)
        body = body.replace("{{ reset_link }}", reset_link)

        message = MessageSchema(
            subject="Reset Your SplitMoney Password",
            recipients=[user.email],
            body=body,
            subtype="html"
        )
        
        # Send email using the configured fast_mail instance
        await fast_mail.send_message(message)
        
        return {"message": "If the email exists, a password reset link has been sent."}
        
    except Exception as e:
        print(f"Password reset error: {e}")
        return {"message": "If the email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    request: PasswordResetConfirm,
    session: Session = Depends(get_session)
):
    """Reset password using the provided token"""
    try:
        # Find the reset token
        reset_token = session.exec(
            select(PasswordResetToken).where(
                PasswordResetToken.token == request.token,
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.now(timezone.utc)
            )
        ).first()
        
        if not reset_token:
            raise HTTPException(
                status_code=400, 
                detail="Invalid or expired reset token"
            )
        
        # Get the user
        user = session.get(User, reset_token.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update password
        user.password_hash = pwd_context.hash(request.new_password)
        session.add(user)
        
        # Mark token as used
        reset_token.used = True
        session.add(reset_token)
        
        session.commit()
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.get("/reset-password/{token}")
async def verify_reset_token(
    token: str,
    session: Session = Depends(get_session)
):
    """Verify if a reset token is valid"""
    reset_token = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.now(timezone.utc)
        )
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Token is valid"}
