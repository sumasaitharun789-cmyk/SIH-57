"""Risk Assessment Engine.

Converts normalized ML results and validated information into standardized
risk levels. This engine is model-agnostic and framework-agnostic.

The risk engine is intentionally prototype/rule-based until the project
team has validated domain-specific thresholds. Until then, prototype
thresholds based on model confidence are used.

Risk levels: low, medium, high, unknown

The engine must ALWAYS return one valid standardized risk level.
It must never return arbitrary strings from clients.

Risk explanation must be responsible and not claim scientific certainty
the system cannot justify.
"""

import os
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.core.config import get_settings

settings = get_settings()


# Prototype risk thresholds (configurable via environment)
# These are NOT scientific or regulatory thresholds - they are prototype values
# for development and integration testing.
# 
#   confidence <  RISK_UNKNOWN_THRESHOLD  → unknown
#   RISK_UNKNOWN_THRESHOLD <= confidence < RISK_LOW_THRESHOLD  → low
#   RISK_LOW_THRESHOLD <= confidence < RISK_MEDIUM_THRESHOLD  → medium
#   confidence >= RISK_HIGH_THRESHOLD  → high
#
# Thresholds must be in range [0.0, 1.0]
# HIGH_THRESHOLD must be > MEDIUM_THRESHOLD > UNKNOWN_THRESHOLD

# Default prototype thresholds:
#   UNKNOWN:  confidence < 0.50
#   LOW:      0.50 <= confidence < 0.70
#   MEDIUM:   0.70 <= confidence < 0.85
#   HIGH:     confidence >= 0.85

# Validate and load thresholds from configuration
def _validate_threshold(value: float, name: str) -> float:
    """Validate that a threshold is in range [0.0, 1.0]."""
    try:
        f = float(value)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=500,
            detail=f"Invalid {name} threshold value: {value}",
        )
    if f < 0.0 or f > 1.0:
        raise HTTPException(
            status_code=500,
            detail=f"{name} threshold must be between 0.0 and 1.0, got {f}",
        )
    return f


def _load_thresholds() -> dict:
    """Load risk thresholds from environment configuration.
    
    Returns a dict with keys: unknown, low, medium, high
    Each value is a float in [0.0, 1.0].
    """
    try:
        unknown = float(os.environ.get(
            "RISK_UNKNOWN_THRESHOLD", "0.50"
        ))
        low = float(os.environ.get(
            "RISK_LOW_THRESHOLD", "0.70"
        ))
        medium = float(os.environ.get(
            "RISK_MEDIUM_THRESHOLD", "0.85"
        ))
        high = float(os.environ.get(
            "RISK_HIGH_THRESHOLD", "0.95"
        ))
        
        # Validate ordering: unknown < low < medium < high
        if not (0.0 <= unknown < low < medium < high <= 1.0):
            # Fall back to defaults if configuration is invalid
            unknown, low, medium, high = 0.50, 0.70, 0.85, 0.95
        
        return {
            "unknown": unknown,
            "low": low,
            "medium": medium,
            "high": high,
        }
    except (ValueError, TypeError):
        # Fall back to defaults on error
        return {
            "unknown": 0.50,
            "low": 0.70,
            "medium": 0.85,
            "high": 0.95,
        }


_risk_thresholds = _load_thresholds()


def assess_risk(confidence: Decimal, prediction: Optional[str] = None) -> dict:
    """Assess risk level from model confidence and optional prediction.
    
    This is a prototype rule-based engine. The thresholds are configurable
    via environment variables (RISK_UNKNOWN_THRESHOLD, RISK_LOW_THRESHOLD,
    RISK_MEDIUM_THRESHOLD, RISK_HIGH_THRESHOLD).
    
    The engine is model-agnostic - it works with any confidence value
    from any ML model that follows the PredictionResult contract.
    
    Important: These are PROTOTYPE thresholds, not scientifically validated
    regulatory thresholds. They are intentionally conservative for a prototype.
    
    Args:
        confidence: Model confidence value (Decimal, 0.0-1.0)
        prediction: Optional prediction label/string
    
    Returns:
        dict with keys:
        - risk_level: one of "low", "medium", "high", "unknown"
        - risk_score: Decimal confidence value
        - risk_reason: human-readable explanation
    """
    try:
        conf_float = float(confidence)
    except (ValueError, TypeError, InvalidOperation):
        # Invalid confidence → unknown
        return {
            "risk_level": "unknown",
            "risk_score": Decimal("0.0"),
            "risk_reason": "Could not interpret model confidence value",
        }
    
    # Check for missing/invalid confidence
    if conf_float is None or conf_float != conf_float:  # NaN check
        return {
            "risk_level": "unknown",
            "risk_score": Decimal("0.0"),
            "risk_reason": "Model confidence is unavailable",
        }
    
    # Apply prototype risk thresholds
    unknown_thresh = _risk_thresholds["unknown"]
    low_thresh = _risk_thresholds["low"]
    medium_thresh = _risk_thresholds["medium"]
    high_thresh = _risk_thresholds["high"]
    
    if conf_float < unknown_thresh:
        # Below unknown threshold → unknown risk
        return {
            "risk_level": "unknown",
            "risk_score": confidence,
            "risk_reason": "Model confidence too low for risk assessment",
        }
    elif conf_float < low_thresh:
        # Low confidence → low risk
        return {
            "risk_level": "low",
            "risk_score": confidence,
            "risk_reason": "Low risk based on current model confidence",
        }
    elif conf_float < medium_thresh:
        # Medium confidence → medium risk
        return {
            "risk_level": "medium",
            "risk_score": confidence,
            "risk_reason": "Medium risk based on the model prediction and confidence",
        }
    elif conf_float < high_thresh:
        # High confidence → high risk
        return {
            "risk_level": "high",
            "risk_score": confidence,
            "risk_reason": "High risk based on a high-confidence model prediction",
        }
    else:
        # Above high threshold → high risk
        return {
            "risk_level": "high",
            "risk_score": confidence,
            "risk_reason": "High risk based on a high-confidence model prediction",
        }


def get_risk_explanation(risk_level: str, confidence: Decimal, prediction: Optional[str] = None) -> str:
    """Generate a human-readable explanation for the risk result.
    
    Uses responsible wording that does not claim scientific certainty
    the system cannot justify.
    """
    conf_float = float(confidence)
    
    if risk_level == "high":
        if prediction:
            return f"High risk based on a high-confidence model prediction "
            f"for '{prediction}' with confidence {conf_float:.2f}."
        return "High risk based on a high-confidence model prediction."
    
    elif risk_level == "medium":
        if prediction:
            return f"Medium risk based on the model prediction and confidence "
            f"for '{prediction}' with confidence {conf_float:.2f}."
        return "Medium risk based on the model prediction and confidence."
    
    elif risk_level == "low":
        if prediction:
            return f"Low risk based on the current model confidence "
            f"for '{prediction}' with confidence {conf_float:.2f}."
        return "Low risk based on the current model confidence."
    
    elif risk_level == "unknown":
        if prediction:
            return f"Risk could not be determined reliably from the available model output "
            f"for '{prediction}' with confidence {conf_float:.2f}."
        return "Risk could not be determined reliably from the available model output."
    
    # Fallback
    return "Risk assessment could not be completed."


# Convenience function for use in detection workflow
def calculate_risk_from_prediction(result: dict) -> dict:
    """Calculate risk from a PredictionResult dict.
    
    Expected dict keys:
    - "prediction": str (optional)
    - "confidence": Decimal or numeric (optional)
    
    Returns dict with:
    - risk_level: str
    - risk_score: Decimal
    - risk_reason: str
    """
    prediction = result.get("prediction") if isinstance(result, dict) else None
    confidence = result.get("confidence") if isinstance(result, dict) else None
    
    if confidence is None:
        confidence = Decimal("0.0")
    elif isinstance(confidence, str):
        try:
            confidence = Decimal(confidence)
        except (ValueError, InvalidOperation):
            confidence = Decimal("0.0")
    elif not isinstance(confidence, Decimal):
        confidence = Decimal(str(confidence))
    
    risk = assess_risk(confidence, prediction)
    return risk