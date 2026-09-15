"""Temporary mock model for backend development and frontend integration.

Replaced later by the real model — the API only knows the interface.

The mock model produces deterministic test output that follows the
backend's normalized PredictionResult schema. This clearly labels output
as mock/test data.
"""

from datetime import datetime
from decimal import Decimal
import hashlib
from typing import Any, Dict, List

from app.ml.interface import PredictionModel, ModelMetadata
from app.schemas.prediction_result import DetectionResult, PredictionResult


CANDIDATE_CLASSES = [
    {
        "class": "ghost_net",
        "confidence": Decimal("0.96"),
        "bbox": {"x": 380, "y": 220, "width": 180, "height": 130},
        "range_m": 48.5,
        "across_track_m": 32.4,
        "along_track_m": 16.1,
        "heading_deg": 88.5,
        "depth": 18.2,
        "evidence": {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": True,
            "texture_characteristics": True,
        },
    },
    {
        "class": "shipwreck",
        "confidence": Decimal("0.93"),
        "bbox": {"x": 260, "y": 180, "width": 240, "height": 160},
        "range_m": 62.0,
        "across_track_m": 45.2,
        "along_track_m": 22.8,
        "heading_deg": 91.0,
        "depth": 24.5,
        "evidence": {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": True,
            "texture_characteristics": False,
        },
    },
    {
        "class": "fishing_gear",
        "confidence": Decimal("0.89"),
        "bbox": {"x": 420, "y": 310, "width": 140, "height": 110},
        "range_m": 35.8,
        "across_track_m": 21.0,
        "along_track_m": 14.2,
        "heading_deg": 85.0,
        "depth": 15.6,
        "evidence": {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": False,
            "texture_characteristics": True,
        },
    },
    {
        "class": "pipe",
        "confidence": Decimal("0.91"),
        "bbox": {"x": 310, "y": 260, "width": 290, "height": 70},
        "range_m": 54.2,
        "across_track_m": 38.6,
        "along_track_m": 19.5,
        "heading_deg": 92.4,
        "depth": 21.0,
        "evidence": {
            "ai_detection": True,
            "acoustic_shadow": False,
            "shape_characteristics": True,
            "texture_characteristics": True,
        },
    },
    {
        "class": "other_debris",
        "confidence": Decimal("0.87"),
        "bbox": {"x": 350, "y": 290, "width": 150, "height": 120},
        "range_m": 41.0,
        "across_track_m": 27.5,
        "along_track_m": 15.0,
        "heading_deg": 89.0,
        "depth": 17.8,
        "evidence": {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": True,
            "texture_characteristics": False,
        },
    },
]


class MockModel(PredictionModel):
    """Deterministic stub that simulates a prediction result.
    
    This is purely for backend development and frontend integration testing.
    It does not require an actual ML model, internet access, or paid services.
    """
    
    model_metadata: ModelMetadata = ModelMetadata(model_name="heuristic-acoustic-mock")
    
    def predict(self, data: Any) -> PredictionResult:
        """Return a deterministic mock prediction result."""
        data_hash = 0
        if isinstance(data, (bytes, bytearray)) and len(data) > 0:
            data_hash = int(hashlib.md5(data[:256]).hexdigest(), 16)
        elif isinstance(data, str) and len(data) > 0:
            data_hash = int(hashlib.md5(data.encode('utf-8')).hexdigest(), 16)
        
        candidate = CANDIDATE_CLASSES[data_hash % len(CANDIDATE_CLASSES)]
        
        return PredictionResult(
            prediction=candidate["class"],
            confidence=candidate["confidence"],
            detections=[
                DetectionResult(
                    label=candidate["class"],
                    confidence=candidate["confidence"],
                    bbox=candidate["bbox"],
                )
            ],
            metadata={
                "model": "mock",
                "model_name": self.model_metadata.model_name,
                "is_mock": True,
                "source": "test-development-only",
                "range_m": candidate["range_m"],
                "across_track_m": candidate["across_track_m"],
                "along_track_m": candidate["along_track_m"],
                "heading_deg": candidate["heading_deg"],
                "depth": candidate["depth"],
                "evidence": candidate["evidence"],
                "bounding_box": candidate["bbox"],
            },
            created_at=datetime.utcnow(),
        )