"""Dashboard and analytics service layer.

Provides database-side aggregation for dashboard statistics.
Keeps SQL logic out of route handlers and reuses existing models.
"""

from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.db.models import Detection, Report, RiskLevel, DetectionStatus, ReportStatus
from app.db.enums import RiskLevel as RiskLevelEnum, DetectionStatus as DetectionStatusEnum
from app.schemas.detection_response import DetectionResponse


def _get_user_detection_query(db: Session, user_id: int):
    """Build a base query for the authenticated user's detections."""
    return db.query(Detection).filter(Detection.user_id == user_id)


def _get_user_report_query(db: Session, user_id: int):
    """Build a base query for the authenticated user's reports."""
    return db.query(Report).filter(Report.user_id == user_id)


def get_dashboard_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Get complete dashboard summary for a user.

    Uses database-side aggregation for efficiency.
    Returns only the authenticated user's data.
    """
    # Detection counts by status
    status_counts = (
        db.query(
            Detection.status,
            func.count(Detection.id).label("count"),
        )
        .filter(Detection.user_id == user_id)
        .group_by(Detection.status)
        .all()
    )

    # Detection counts by risk level
    risk_counts = (
        db.query(
            Detection.risk_level,
            func.count(Detection.id).label("count"),
        )
        .filter(Detection.user_id == user_id)
        .group_by(Detection.risk_level)
        .all()
    )

    # Total reports and status counts
    report_counts = (
        db.query(
            Report.status,
            func.count(Report.id).label("count"),
        )
        .filter(Report.user_id == user_id)
        .group_by(Report.status)
        .all()
    )

    # Prediction/class distribution (top categories only, sorted by count desc)
    prediction_counts = (
        db.query(
            Detection.prediction,
            func.count(Detection.id).label("count"),
        )
        .filter(Detection.user_id == user_id)
        .filter(Detection.prediction.isnot(None))
        .group_by(Detection.prediction)
        .order_by(desc("count"))
        .limit(50)  # sensible maximum
        .all()
    )

    # Recent detections (newest first, bounded to 50)
    recent = (
        db.query(Detection)
        .filter(Detection.user_id == user_id)
        .order_by(desc(Detection.created_at))
        .limit(50)
        .all()
    )

    # Build status count mapping
    status_map: Dict[str, int] = {}
    for status_val, count in status_counts:
        key = status_val.value if hasattr(status_val, "value") else str(status_val)
        status_map[key] = count

    # Build risk count mapping (ensure all 4 categories present)
    risk_map: Dict[str, int] = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "unknown": 0,
    }
    for risk_val, count in risk_counts:
        key = risk_val.value if hasattr(risk_val, "value") else str(risk_val)
        risk_map[key] = count

    # Build prediction list
    predictions: List[Dict[str, str | int]] = [
        {"prediction": pred, "count": count} for pred, count in prediction_counts
    ]

    # Build report status mapping
    report_status_map: Dict[str, int] = {}
    for status_val, count in report_counts:
        key = status_val.value if hasattr(status_val, "value") else str(status_val)
        report_status_map[key] = count

    # Build recent detections summary (minimal fields)
    recent_items = []
    for det in recent:
        recent_items.append(
            {
                "id": det.id,
                "prediction": det.prediction,
                "confidence": float(det.confidence) if det.confidence else 0.0,
                "risk_level": det.risk_level.value if hasattr(det.risk_level, "value") else str(det.risk_level),
                "status": det.status.value if hasattr(det.status, "value") else str(det.status),
                "created_at": det.created_at,
            }
        )

    return {
        "total_detections": sum(status_map.values()) if status_map else 0,
        "completed_detections": status_map.get("completed", 0),
        "processing_detections": status_map.get("processing", 0),
        "failed_detections": status_map.get("failed", 0),
        "risk_distribution": risk_map,
        "predictions": predictions,
        "total_reports": sum(report_status_map.values()) if report_status_map else 0,
        "report_status_distribution": report_status_map,
        "recent_detections": recent_items,
    }


def get_report_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Get report statistics for the user."""
    report_counts = (
        db.query(Report.status, func.count(Report.id).label("count"))
        .filter(Report.user_id == user_id)
        .group_by(Report.status)
        .all()
    )

    # Build mapping with all 4 ReportStatus categories
    status_map: Dict[str, int] = {
        "pending": 0,
        "reviewed": 0,
        "resolved": 0,
        "rejected": 0,
    }
    for status_val, count in report_counts:
        key = status_val.value if hasattr(status_val, "value") else str(status_val)
        status_map[key] = count

    total = sum(status_map.values())
    return {
        "total": total,
        **status_map,
    }


def get_recent_detections(db: Session, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent detections for the user, bounded by limit."""
    # Clamp limit to reasonable maximum
    effective_limit = min(max(limit, 1), 50)

    detections = (
        db.query(Detection)
        .filter(Detection.user_id == user_id)
        .order_by(desc(Detection.created_at))
        .limit(effective_limit)
        .all()
    )

    items = []
    for det in detections:
        items.append(
            {
                "id": det.id,
                "prediction": det.prediction,
                "confidence": float(det.confidence) if det.confidence else 0.0,
                "risk_level": det.risk_level,
                "status": det.status,
                "created_at": det.created_at,
            }
        )

    return items


def get_location_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Get location summary for the user's detections."""
    total_locations = (
        db.query(Detection.location_id)
        .filter(Detection.user_id == user_id, Detection.location_id.isnot(None))
        .distinct()
        .count()
    )

    locations_with_detections = (
        db.query(Detection.location_id)
        .filter(Detection.user_id == user_id)
        .distinct()
        .count()
    )

    return {
        "total_locations": total_locations,
        "locations_with_detections": locations_with_detections,
    }