"""File upload schemas."""

from datetime import datetime
from decimal import Decimal
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional


class UploadedFileBase(BaseModel):
    """Base schema for uploaded file metadata."""

    original_filename: str
    stored_filename: str
    content_type: Optional[str] = None
    file_size: Optional[Decimal] = Field(default=None, ge=0)
    created_at: Optional[datetime] = None


class UploadedFileCreate(UploadedFileBase):
    """Schema for creating a file upload record."""

    pass


class UploadedFileResponse(UploadedFileBase):
    """Schema for file upload responses."""

    id: int
    user_id: int
    file_id: Optional[int] = None

    @model_validator(mode="after")
    def set_file_id(self) -> "UploadedFileResponse":
        if self.file_id is None:
            self.file_id = self.id
        return self

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)