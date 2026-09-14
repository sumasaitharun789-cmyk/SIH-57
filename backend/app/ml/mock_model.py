"""Temporary mock model for backend development and frontend integration.

Replaced later by the real model — the API only knows the interface.

The mock model produces deterministic test output that follows the
backend's normalized PredictionResult schema. This clearly labels output
as mock/test data.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List

from app.ml.interface import PredictionModel, ModelMetadata
from app.schemas.prediction_result import DetectionResult, PredictionResult


class MockModel(PredictionModel):
    """Deterministic stub that simulates a prediction result.
    
    This is purely for backend development and frontend integration testing.
    It does not require an actual ML model, internet access, or paid services.
    """
    
    model_metadata: ModelMetadata = ModelMetadata(model_name="mock-model")
    
    def predict(self, data: Any) -> PredictionResult:
        """Return a deterministic mock prediction result.
        
        Args:
            data: Input data (e.g., image path, features). The mock does not
                actually process this; it simply includes it in the result
                metadata for test traceability.
        
        Returns:
            A PredictionResult with mock values. The confidence and prediction
            are clearly mock/test values, not real scientific results.
        """
        return PredictionResult(
            prediction="mock-detection",
            confidence=Decimal("0.90"),
            detections=[
                DetectionResult(
                    label="mock-class",
                    confidence=Decimal("0.90"),
                    bbox={"x": 0, "y": 0, "width": 0, "height": 0},
                )
            ],
            metadata={
                "model": "mock",
                "model_name": self.model_metadata.model_name,
                "source": "test-development-only",
            },
            created_at=datetime.utcnow(),
        )