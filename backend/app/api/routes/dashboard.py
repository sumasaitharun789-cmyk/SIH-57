"""Dashboard and analytics endpoints.

Provides summarized application data for the frontend dashboard.
All endpoints are authenticated and scoped to the JWT-authenticated user.
No admin or organization-wide data in this step.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_report_summary,
    get_recent_detections,
    get_location_summary,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=dict)
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete dashboard summary for the authenticated user.

    Returns aggregated statistics:
    - detection counts by status
    - risk-level distribution
    - prediction/class distribution
    - report statistics
    - recent detections (bounded to 50)

    Authentication: JWT Bearer token required.
    Scope: Only the authenticated user's data.
    """
    summary = get_dashboard_summary(db, current_user.id)
    return summary


@router.get("/recent-detections", response_model=dict)
def recent_detections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(
        20, ge=1, le=50, description="Number of recent detections (1-50)"
    ),
):
    """Get the authenticated user's recent detections, newest first.

    - **limit**: Number of detections to return (1-50, default 20)
    """
    items = get_recent_detections(db, current_user.id, limit=limit)
    return {"items": items, "limit": limit, "returned": len(items)}


@router.get("/report-summary", response_model=dict)
def report_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get report statistics for the authenticated user.

    Returns counts by ReportStatus: pending, reviewed, resolved, rejected.
    """
    summary = get_report_summary(db, current_user.id)
    return summary


@router.get("/location-summary", response_model=dict)
def location_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get location summary for the authenticated user's detections.

    Returns total locations and count with detections.
    """
    summary = get_location_summary(db, current_user.id)
    return summary