"""Location schemas."""

from math import isnan, isinf
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, validator


class LocationBase(BaseModel):
    """Base location schema with common fields."""

    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    location_name: str | None = None

    @validator("latitude")
    def validate_latitude_not_nan_inf(cls, v: Decimal) -> Decimal:
        """Reject NaN and infinity for latitude."""
        v_float = float(v)
        if isnan(v_float) or isinf(v_float):
            raise ValueError("Latitude must be a finite number (not NaN or infinity)")
        return v

    @validator("longitude")
    def validate_longitude_not_nan_inf(cls, v: Decimal) -> Decimal:
        """Reject NaN and infinity for longitude."""
        v_float = float(v)
        if isnan(v_float) or isinf(v_float):
            raise ValueError("Longitude must be a finite number (not NaN or infinity)")
        return v


class LocationCreate(LocationBase):
    """Schema for creating a location."""

    pass


class LocationResponse(LocationBase):
    """Schema for location responses."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)