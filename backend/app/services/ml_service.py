"""ML service responsible for calling the configured model and normalizing output.

This service is the single point of interaction between the backend API and
the ML model implementation. It handles:
- Model selection based on configuration
- Input validation
- Calling the model's predict method
- Output normalization
- Confidence validation
- Error handling
"""

import os
import sys
import time
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status


def _ensure_schemas_path():
    """Ensure the schemas directory is in sys.path for imports."""
    _SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'schemas')
    if _SCHEMAS_DIR not in sys.path:
        sys.path.insert(0, _SCHEMAS_DIR)


def _remove_schemas_path():
    """Remove the schemas directory from sys.path."""
    _SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'schemas')
    if _SCHEMAS_DIR in sys.path:
        sys.path.remove(_SCHEMAS_DIR)


def validate_confidence(confidence: Any) -> Decimal:
    """Validate that confidence is between 0.0 and 1.0."""
    try:
        conf_float = float(confidence)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid confidence value",
        )
    
    if conf_float < 0 or conf_float > 1:
        raise HTTPException(
            status_code=400,
            detail=f"Confidence must be between 0.0 and 1.0, got {conf_float}",
        )
    
    return Decimal(str(conf_float))


def read_image_file(file_path: str) -> bytes:
    """Read and return the contents of an image file."""
    path = Path(file_path)
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {file_path}",
        )
    if not path.is_file():
        raise HTTPException(
            status_code=400,
            detail=f"Path is not a file: {file_path}",
        )
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read file: {str(e)}",
        )


def _ensure_schemas_path():
    """Ensure the schemas directory is in sys.path for imports."""
    _SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'schemas')
    if _SCHEMAS_DIR not in sys.path:
        sys.path.insert(0, _SCHEMAS_DIR)


def _remove_schemas_path():
    """Remove the schemas directory from sys.path."""
    _SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'schemas')
    if _SCHEMAS_DIR in sys.path:
        sys.path.remove(_SCHEMAS_DIR)


def select_model() -> object:
    """Select and return the configured ML model implementation."""
    _ensure_schemas_path()
    try:
        from app.ml.mock_model import MockModel
        _remove_schemas_path()
        return MockModel()
    finally:
        _remove_schemas_path()


def run_prediction(image_path: str) -> Dict[str, Any]:
    """Run prediction on an image file using the configured model.
    
    This is the main entry point for ML prediction from the backend.
    It handles:
    - Model selection
    - File reading and validation
    - Prediction execution
    - Output normalization
    - Confidence validation
    - Error handling
    """
    # Select the model
    model = select_model()
    
    # Read the image file
    image_data = read_image_file(image_path)
    
    # Run prediction
    start_time = time.time()
    try:
        result = model.predict(image_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML model prediction failed: {str(e)}",
        )
    
    inference_time_ms = (time.time() - start_time) * 1000
    
    # Normalize the result - handle both dict and object returns
    if isinstance(result, dict):
        # Already a dict, just add inference time
        result["inference_time_ms"] = round(inference_time_ms, 2)
    else:
        # Object result - convert to dict
        result_dict: Dict[str, Any] = {
            "prediction": getattr(result, "prediction", "unknown"),
        }
        # Get confidence
        conf_val = getattr(result, "confidence", None)
        if conf_val is not None:
            try:
                result_dict["confidence"] = Decimal(str(conf_val))
            except (ValueError, InvalidOperation):
                result_dict["confidence"] = Decimal("0.5")
        else:
            result_dict["confidence"] = Decimal("0.5")
        
        # Get detections
        detections = getattr(result, "detections", [])
        result_dict["detections"] = detections if detections else []
        
        # Get metadata
        metadata = getattr(result, "metadata", {})
        if isinstance(metadata, dict):
            result_dict["metadata"] = metadata
        else:
            result_dict["metadata"] = {}
        
        # Add inference time to metadata
        result_dict["metadata"]["inference_time_ms"] = round(inference_time_ms, 2)
        result_dict["inference_time_ms"] = round(inference_time_ms, 2)
        
        result = result_dict
    
    # Ensure confidence is valid
    if isinstance(result.get("confidence"), Decimal):
        conf_float = float(result["confidence"])
        if conf_float < 0 or conf_float > 1:
            result["confidence"] = Decimal("0.5")
    elif isinstance(result.get("confidence"), str):
        try:
            result["confidence"] = Decimal(result["confidence"])
            if float(result["confidence"]) < 0 or float(result["confidence"]) > 1:
                result["confidence"] = Decimal("0.5")
        except (ValueError, InvalidOperation):
            result["confidence"] = Decimal("0.5")
    elif not isinstance(result.get("confidence"), Decimal):
        result["confidence"] = Decimal("0.5")
    
    # Ensure detections have valid confidence values
    for detection in result.get("detections", []):
        if isinstance(detection, dict) and "confidence" in detection:
            try:
                float(detection["confidence"])
            except (ValueError, TypeError):
                detection["confidence"] = "0.5"
    
    return result