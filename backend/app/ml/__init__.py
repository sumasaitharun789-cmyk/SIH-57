"""ML integration layer.

Exposes only the prediction interface contract. API routes and services
depend on this layer, never on a concrete ML framework (YOLO, PyTorch,
TensorFlow, scikit-learn, ...).

The configured model implementation is returned by get_prediction_model().
Currently the mock model is used for development and testing.
"""

from app.ml.interface import PredictionModel, ModelMetadata
from app.ml.mock_model import MockModel

__all__ = ["PredictionModel", "ModelMetadata", "get_prediction_model"]


def get_prediction_model() -> PredictionModel:
    """Return the active prediction model implementation.

    Currently returns the mock model for backend/frontend development.
    Swap the real model here later without touching the API routes.
    The model import is lazy so heavy frameworks are only loaded when
    the prediction feature is actually used.
    """
    return MockModel()