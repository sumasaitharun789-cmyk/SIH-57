"""Report schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional

from app.db.enums import ReportStatus


class ReportBase(BaseModel):
    """Base report schema with common fields."""

    title: str
    description: Optional[str] = None
    status: ReportStatus = ReportStatus.PENDING

    @field_validator("title")
    def validate_title_not_empty(cls, v: str) -> str:
        """Title must not be empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("Title must not be empty or whitespace-only")
        if len(v) > 255:
            raise ValueError("Title must not exceed 255 characters")
        return v

    @field_validator("description")
    def validate_description_not_empty_if_provided(cls, v: Optional[str]) -> Optional[str]:
        """Description, if provided, must not be whitespace-only."""
        if v is not None and not v.strip():
            raise ValueError("Description must not be whitespace-only")
        if v is not None and len(v) > 1000:
            raise ValueError("Description must not exceed 1000 characters")
        return v


class ReportCreate(ReportBase):
    """Schema for creating a report.

    Note: user_id is NOT included here - it is set from the
    authenticated JWT user, never trusted from the client.
    detection_id is optional - a report can exist independently
    or be associated with a detection the user owns.
    """

    detection_id: Optional[int] = None


class ReportResponse(BaseModel):
    """Schema for report responses.

    Exposes only safe fields. Internal database details and
    security information are excluded.
    """

    id: int
    title: str
    description: Optional[str] = None
    status: str
    detection_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)