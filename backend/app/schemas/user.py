"""User schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Base user schema with common fields."""

    username: str
    email: EmailStr
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a user (password handled separately in auth step)."""

    password: str  # Plain text here; hashing happens in auth service later


class UserResponse(UserBase):
    """Schema for user responses (excludes hashed_password)."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)