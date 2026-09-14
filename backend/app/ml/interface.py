"""ML model abstraction / contract.

The backend depends on this interface, not on any specific ML framework.
Every concrete model (YOLO, CNN, PyTorch, TensorFlow, scikit-learn, ...)
must implement this contract so it can be swapped transparently.

The predict method returns a normalized PredictionResult that the backend
uses regardless of the underlying model implementation.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import sys
import os

from app.schemas.prediction_result import PredictionResult, DetectionResult


class PredictionModel(ABC):
    """Interface every prediction model must implement.

    The backend depends on this contract, not on any specific ML framework.
    Individual models may produce different output formats, but the backend
    normalizes everything into the standard PredictionResult schema.
    """

    @abstractmethod
    def predict(self, data: Any) -> PredictionResult:
        """Run a prediction against the input data.

        Args:
            data: Input data expected by the concrete model (e.g., image path,
                features, text, etc.).

        Returns:
            A normalized PredictionResult containing the prediction label,
            confidence score, optional detections, and metadata.

        Raises:
            ValueError: If the input data is invalid or the model fails.
        """
        raise NotImplementedError


class ModelMetadata:
    """Metadata about the ML model implementation."""
    
    def __init__(self, model_name: str = "unknown", 
                 model_version: Optional[str] = None, 
                 inference_time_ms: Optional[float] = None):
        self.model_name = model_name
        self.model_version = model_version
        self.inference_time_ms = inference_time_ms