"""Detection schemas."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import DetectionStatus, InputType, RiskLevel


class DetectionBase(BaseModel):
    """Base detection schema with common fields."""

    input_type: InputType = InputType.OTHER
    input_reference: str | None = None
    prediction: str | None = None
    confidence: Decimal | None = Field(default=None, ge=0, le=1)
    risk_level: RiskLevel = RiskLevel.UNKNOWN
    status: DetectionStatus = DetectionStatus.PENDING


class DetectionCreate(DetectionBase):
    """Schema for creating a detection (requires user_id and location_id)."""

    user_id: int
    location_id: int


class DetectionResponse(DetectionBase):
    """Schema for detection responses."""

    id: int
    user_id: int
    location_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)