"""Prediction result schema - model-independent contract.

Defines the normalized prediction result structure that the backend uses
internally. Individual ML models may produce different output formats,
but the backend normalizes everything into this common schema.

Bounding boxes are optional — if the final model is a classifier without
detection capabilities, the backend must still work.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class DetectionResult(BaseModel):
    """Single detection result within a prediction."""
    
    label: str = Field(..., description="Detected class/category label")
    confidence: Decimal = Field(..., ge=0, le=1, description="Confidence score 0.0-1.0")
    bbox: Optional[Dict[str, int]] = Field(
        default=None, 
        description="Bounding box {x, y, width, height} — optional, model-dependent"
    )
    
    model_config = ConfigDict(frozen=False)


class PredictionResult(BaseModel):
    """Normalized prediction result from any ML model."""
    
    prediction: str = Field(..., description="Primary prediction label")
    confidence: Decimal = Field(..., ge=0, le=1, description="Overall confidence 0.0-1.0")
    detections: List[DetectionResult] = Field(
        default_factory=list,
        description="List of individual detections (optional, model-dependent)"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional model metadata (optional)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the prediction was created"
    )
    
    model_config = ConfigDict(frozen=False)