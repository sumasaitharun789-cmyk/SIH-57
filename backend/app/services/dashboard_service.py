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


def get_analytics_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Get rich analytics aggregation for user detections, with graceful demo fallback."""
    detections = db.query(Detection).filter(Detection.user_id == user_id).all()
    
    if not detections:
        # Graceful demo baseline for empty databases (clearly marked as demo)
        return {
            "is_demo": True,
            "total_detections": 127,
            "average_confidence": 0.91,
            "high_risk_count": 24,
            "by_class": {
                "ghost_net": 28,
                "shipwreck": 8,
                "fishing_gear": 21,
                "pipe": 14,
                "other_debris": 56,
            },
            "by_risk": {
                "low": 48,
                "medium": 55,
                "high": 24,
            },
            "confidence_distribution": {
                "90_100": 62,
                "80_90": 38,
                "70_80": 18,
                "60_70": 6,
                "below_60": 3,
            },
            "over_time": [
                {"date": "2026-09-08", "count": 12, "ghost_net": 3, "shipwreck": 1, "fishing_gear": 2, "pipe": 1, "other_debris": 5},
                {"date": "2026-09-09", "count": 18, "ghost_net": 4, "shipwreck": 0, "fishing_gear": 3, "pipe": 2, "other_debris": 9},
                {"date": "2026-09-10", "count": 15, "ghost_net": 2, "shipwreck": 2, "fishing_gear": 4, "pipe": 1, "other_debris": 6},
                {"date": "2026-09-11", "count": 22, "ghost_net": 6, "shipwreck": 1, "fishing_gear": 3, "pipe": 3, "other_debris": 9},
                {"date": "2026-09-12", "count": 19, "ghost_net": 4, "shipwreck": 1, "fishing_gear": 2, "pipe": 2, "other_debris": 10},
                {"date": "2026-09-13", "count": 25, "ghost_net": 5, "shipwreck": 2, "fishing_gear": 4, "pipe": 3, "other_debris": 11},
                {"date": "2026-09-14", "count": 16, "ghost_net": 4, "shipwreck": 1, "fishing_gear": 3, "pipe": 2, "other_debris": 6},
            ],
        }

    total = len(detections)
    confidences = [float(d.confidence) for d in detections if d.confidence is not None]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.85
    if avg_conf > 1.0:
        avg_conf = avg_conf / 100.0

    by_class: Dict[str, int] = {
        "ghost_net": 0,
        "shipwreck": 0,
        "fishing_gear": 0,
        "pipe": 0,
        "other_debris": 0,
    }
    for d in detections:
        pred = (d.prediction or "").lower()
        if "net" in pred:
            by_class["ghost_net"] = by_class.get("ghost_net", 0) + 1
        elif "ship" in pred or "wreck" in pred:
            by_class["shipwreck"] = by_class.get("shipwreck", 0) + 1
        elif "gear" in pred or "trap" in pred:
            by_class["fishing_gear"] = by_class.get("fishing_gear", 0) + 1
        elif "pipe" in pred or "cylinder" in pred:
            by_class["pipe"] = by_class.get("pipe", 0) + 1
        else:
            by_class["other_debris"] = by_class.get("other_debris", 0) + 1

    by_risk: Dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for d in detections:
        r = str(d.risk_level.value if hasattr(d.risk_level, "value") else d.risk_level).lower()
        if "high" in r:
            by_risk["high"] += 1
        elif "low" in r:
            by_risk["low"] += 1
        else:
            by_risk["medium"] += 1

    conf_dist: Dict[str, int] = {
        "90_100": 0,
        "80_90": 0,
        "70_80": 0,
        "60_70": 0,
        "below_60": 0,
    }
    for c in confidences:
        val = c if c <= 1.0 else c / 100.0
        if val >= 0.90:
            conf_dist["90_100"] += 1
        elif val >= 0.80:
            conf_dist["80_90"] += 1
        elif val >= 0.70:
            conf_dist["70_80"] += 1
        elif val >= 0.60:
            conf_dist["60_70"] += 1
        else:
            conf_dist["below_60"] += 1

    from collections import defaultdict
    day_counts = defaultdict(lambda: {"count": 0, "ghost_net": 0, "shipwreck": 0, "fishing_gear": 0, "pipe": 0, "other_debris": 0})
    for d in detections:
        day_str = d.created_at.strftime("%Y-%m-%d") if d.created_at else datetime.utcnow().strftime("%Y-%m-%d")
        day_counts[day_str]["count"] += 1
        pred = (d.prediction or "").lower()
        if "net" in pred:
            day_counts[day_str]["ghost_net"] += 1
        elif "ship" in pred or "wreck" in pred:
            day_counts[day_str]["shipwreck"] += 1
        elif "gear" in pred:
            day_counts[day_str]["fishing_gear"] += 1
        elif "pipe" in pred:
            day_counts[day_str]["pipe"] += 1
        else:
            day_counts[day_str]["other_debris"] += 1

    over_time = [{"date": k, **v} for k, v in sorted(day_counts.items())]

    return {
        "is_demo": False,
        "total_detections": total,
        "average_confidence": round(avg_conf, 2),
        "high_risk_count": by_risk["high"],
        "by_class": by_class,
        "by_risk": by_risk,
        "confidence_distribution": conf_dist,
        "over_time": over_time,
    }