"""Report endpoints.

Handles the full report workflow:
- Create reports (linked to user's own detections)
- Retrieve user's reports
- Update report editable fields
- Delete reports

All endpoints enforce ownership via JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.report import ReportCreate, ReportResponse
from app.services.reports_service import (
    create_report,
    get_user_reports,
    get_report,
    update_report,
    delete_report,
    can_user_report_detection,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report_endpoint(
    request: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new report.

    Authenticated user can create a report. The user_id is set from
    the JWT token, never trusted from the client request.

    If detection_id is provided, the report is associated with that
    detection (which must belong to the current user).

    - **title**: Report title (required, validated)
    - **description**: Report description (optional)
    - **detection_id**: Optional detection ID to link the report to
    """
    # Use the authenticated user from JWT, NOT from client input
    user = current_user

    # If detection_id is provided, verify ownership
    detection_id = request.detection_id

    # Build the report creation request without user_id (it's server-set)
    # The schema already excludes user_id, so we just pass title/description
    report = create_report(
        db,
        user=user,
        title=request.title,
        description=request.description,
        detection_id=detection_id,
    )

    return ReportResponse(
        id=report.id,
        title=report.title,
        description=report.description,
        status=report.status,
        detection_id=report.detection_id,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.get("/", response_model=dict)
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    """List the authenticated user's reports.

    Pagination is supported. Returns reports newest first.

    - **page**: Page number (1-indexed)
    - **page_size**: Items per page (max 100)
    """
    # Enforce max page size
    effective_page_size = min(page_size, 100)

    data = get_user_reports(db, user=current_user, page=page, page_size=effective_page_size)
    return data


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_endpoint(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single report by ID.

    Only the report owner can access it. Returns 404 if the report
    does not exist or is not accessible to the current user.

    - **report_id**: ID of the report to retrieve
    """
    try:
        report = get_report(db, report_id=report_id, user=current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    return ReportResponse(
        id=report.id,
        title=report.title,
        description=report.description,
        status=report.status,
        detection_id=report.detection_id,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report_endpoint(
    report_id: int,
    request: ReportCreate,  # Reuse schema for validation of editable fields
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a report's editable fields.

    Only the report owner can update title and description.
    Status, user_id, created_at, and internal fields are NOT modifiable.

    - **report_id**: ID of the report to update
    - **title**: New title (optional, validated if provided)
    - **description**: New description (optional, validated if provided)
    """
    # First verify ownership
    try:
        report = get_report(db, report_id=report_id, user=current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    # Update editable fields
    try:
        updated = update_report(
            db,
            report=report,
            title=request.title,
            description=request.description,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    return ReportResponse(
        id=updated.id,
        title=updated.title,
        description=updated.description,
        status=updated.status,
        detection_id=updated.detection_id,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_endpoint(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a report.

    Only the report owner can delete it. The associated detection
    and uploaded files are NOT automatically deleted.

    - **report_id**: ID of the report to delete
    """
    # First verify ownership
    try:
        report = get_report(db, report_id=report_id, user=current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    delete_report(db, report=report)
    return None