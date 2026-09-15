"""Detection response schema."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class DetectionResponse(BaseModel):
    """Response schema for a detection record.
    
    Contains application-level information without exposing
    database internals or filesystem paths.
    """
    
    id: int
    prediction: str
    confidence: Decimal
    risk_level: str
    status: str
    created_at: datetime
    
    risk_score: Optional[float] = None
    risk_reason: Optional[str] = None
    location_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Optional detections from the ML result (as dictionaries)
    detections: List[Dict[str, Any]] = []
    
    uploaded_file_id: Optional[int] = None
    depth: Optional[float] = None
    range_m: Optional[float] = None
    along_track_m: Optional[float] = None
    across_track_m: Optional[float] = None
    heading_deg: Optional[float] = None
    bounding_box: Optional[Dict[str, Any]] = None
    evidence: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)