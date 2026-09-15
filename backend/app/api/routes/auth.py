"""Authentication endpoints.

Register, login, and current-user endpoints using JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.db.database import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user.

    Validates that username and email are unique,
    hashes the password, and creates the user.
    """
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        )

    # Hash password
    hashed_password = get_password_hash(user_in.password)

    # Create user
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    """Login user and return JWT access token.

    Accepts either username or email with password in JSON or Form data.
    """
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            form_data = await request.json()
        except Exception:
            form_data = {}
    else:
        try:
            form = await request.form()
            form_data = dict(form)
        except Exception:
            try:
                form_data = await request.json()
            except Exception:
                form_data = {}

    # Try to find user by username or email
    identifier = form_data.get("username") or form_data.get("email")
    password = form_data.get("password")

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required",
        )

    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )

    # Create JWT access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's information.

    Requires valid JWT Bearer token in Authorization header.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }