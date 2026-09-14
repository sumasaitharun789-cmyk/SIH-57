"""Detection request schema."""

from pydantic import BaseModel, Field, validator
from typing import Optional
from math import isnan, isinf


class DetectionRequest(BaseModel):
    """Request schema for starting a detection.

    The client provides only the file_id (and optionally location).
    The backend generates all other fields.
    """

    file_id: int = Field(..., description="ID of the uploaded image file")

    latitude: Optional[float] = Field(
        default=None, ge=-90, le=90, description="Latitude of detection location"
    )
    longitude: Optional[float] = Field(
        default=None, ge=-180, le=180, description="Longitude of detection location"
    )

    @validator("latitude")
    def validate_latitude_not_nan_inf(cls, v: float) -> float:
        """Reject NaN and infinity for latitude."""
        if v is not None:
            v_float = float(v)
            if isnan(v_float) or isinf(v_float):
                raise ValueError("Latitude must be a finite number (not NaN or infinity)")
        return v

    @validator("longitude")
    def validate_longitude_not_nan_inf(cls, v: float) -> float:
        """Reject NaN and infinity for longitude."""
        if v is not None:
            v_float = float(v)
            if isnan(v_float) or isinf(v_float):
                raise ValueError("Longitude must be a finite number (not NaN or infinity)")
        return v