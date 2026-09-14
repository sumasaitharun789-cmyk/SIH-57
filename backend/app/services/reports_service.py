"""Report service layer.

Handles report business logic including ownership verification,
detection association, and status management.

Keep this independent of route handlers so it can be reused
or tested separately.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import User, Detection, Report, ReportStatus
from app.db.enums import ReportStatus as ReportStatusEnum
from app.schemas.report import ReportCreate, ReportResponse


def create_report(
    db: Session,
    *,
    user: object,  # User object from JWT authentication
    title: str,
    description: str | None,
    detection_id: int | None = None,
) -> Report:
    """Create a new report for the authenticated user.

    Args:
        db: SQLAlchemy session
        user: Authenticated user from JWT (NOT from client input)
        title: Report title (validated by schema)
        description: Report description (optional)
        detection_id: Optional detection ID to associate with

    Returns:
        The created Report object

    Raises:
        HTTPException: If detection_id is provided but doesn't belong to user
    """
    # If detection_id is provided, verify it exists and belongs to this user
    if detection_id is not None:
        detection = (
            db.query(Detection)
            .filter(
                Detection.id == detection_id,
                Detection.user_id == user.id,
            )
            .first()
        )
        if detection is None:
            raise ValueError(
                "Detection not found or you don't have access to it"
            )
    else:
        detection = None

    db_report = Report(
        user_id=user.id,
        title=title,
        description=description,
        detection_id=detection_id,
        status=ReportStatus.PENDING,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_user_reports(
    db: Session,
    *,
    user: object,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """List reports for the authenticated user with pagination.

    Args:
        db: SQLAlchemy session
        user: Authenticated user from JWT
        page: Page number (1-indexed)
        page_size: Items per page (max 100)

    Returns:
        Paginated dict with items, page, page_size, total
    """
    # Queries reports for this user, newest first
    query = db.query(Report).filter(Report.user_id == user.id)

    total = query.count()

    reports = (
        query.order_by(desc(Report.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for report in reports:
        # Safely get detection info if linked
        detection_title = None
        detection_prediction = None
        if report.detection is not None:
            detection_title = report.detection.prediction
            detection_prediction = float(report.detection.confidence) if report.detection.confidence else None

        items.append(
            {
                "id": report.id,
                "title": report.title,
                "description": report.description,
                "status": report.status,
                "detection_id": report.detection_id,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
                "detection_prediction": detection_title,
                "detection_confidence": detection_prediction,
            }
        )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def get_report(
    db: Session,
    *,
    report_id: int,
    user: object,
) -> Report | None:
    """Get a single report if the user owns it.

    Args:
        db: SQLAlchemy session
        report_id: Report ID to retrieve
        user: Authenticated user from JWT

    Returns:
        Report object if found and owned by user, None otherwise

    Raises:
        ValueError: If report doesn't exist or user doesn't have access
    """
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == user.id)
        .first()
    )

    if report is None:
        raise ValueError("Report not found or you don't have access to it")

    return report


def update_report(
    db: Session,
    *,
    report: Report,
    title: str | None = None,
    description: str | None = None,
) -> Report:
    """Update a report's editable fields.

    Only title and description can be modified by the report owner.
    Status, user_id, created_at, and internal fields are NOT modifiable
    through this endpoint.

    Args:
        db: SQLAlchemy session
        report: The report to update (already verified as user-owned)
        title: New title (optional; validated if provided)
        description: New description (optional; validated if provided)

    Returns:
        The updated Report object

    Raises:
        ValueError: If provided title/description are invalid
    """
    if title is not None:
        # Re-validate title
        if not title or not title.strip():
            raise ValueError("Title must not be empty or whitespace-only")
        if len(title) > 255:
            raise ValueError("Title must not exceed 255 characters")
        report.title = title

    if description is not None:
        # Re-validate description
        if description is not None and not description.strip():
            raise ValueError("Description must not be whitespace-only")
        if description is not None and len(description) > 1000:
            raise ValueError("Description must not exceed 1000 characters")
        report.description = description

    report.updated_at = datetime.utcnow()
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def delete_report(
    db: Session,
    *,
    report: Report,
) -> None:
    """Delete a report.

    Does NOT automatically delete the associated Detection or
    uploaded files. The report is simply removed from the database.

    Args:
        db: SQLAlchemy session
        report: The report to delete (already verified as user-owned)
    """
    db.delete(report)
    db.commit()


def can_user_report_detection(
    db: Session,
    *,
    user_id: int,
    detection_id: int,
) -> bool:
    """Check if a user can report a specific detection.

    A user can only report their own detections.

    Args:
        db: SQLAlchemy session
        user_id: The user's ID (from JWT)
        detection_id: The detection ID to check

    Returns:
        True if the user owns the detection, False otherwise
    """
    detection = (
        db.query(Detection)
        .filter(
            Detection.id == detection_id,
            Detection.user_id == user_id,
        )
        .first()
    )
    return detection is not None