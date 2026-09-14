"""File upload and retrieval endpoints.

Handles image uploads with validation, secure storage, and authenticated
retrieval/deletion. All operations require a valid JWT.
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db.database import get_db, engine
from app.db.models import User, UploadedFile
from app.schemas.upload import UploadedFileResponse, UploadedFileCreate

settings = get_settings()

# Upload directory setup
UPLOAD_DIR = Path(settings.upload_dir)
MAX_UPLOAD_SIZE = settings.max_upload_size_mb * 1024 * 1024  # Convert MB to bytes

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/files", tags=["files"])


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/tif",
}


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file type and size."""
    # Check file size
    file_size = 0
    content = file.file.read()
    file_size = len(content)

    if file_size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file provided")

    # Reset file position
    file.file.seek(0)

    # Validate content type
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    content_type = file.content_type or ""

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. "
            f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension: {ext}. "
            f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )


@router.post("/images", response_model=UploadedFileResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload an image file.

    Requires authentication. Accepts JPEG, PNG, and WEBP formats.
    Returns a reference to the stored file.
    """
    # Validate file
    validate_file(file)

    # Generate safe unique filename
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{ext}"
    storage_path = UPLOAD_DIR / unique_filename

    # Save file to disk
    try:
        with open(storage_path, "wb") as f:
            content = file.file.read()
            f.write(content)
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to store uploaded file",
        )

    # Create database metadata
    db_file = UploadedFile(
        user_id=current_user.id,
        original_filename=file.filename or "unknown",
        stored_filename=unique_filename,
        content_type=file.content_type,
        file_size=len(content),
        storage_path=str(storage_path),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return UploadedFileResponse(
        id=db_file.id,
        user_id=db_file.user_id,
        original_filename=db_file.original_filename,
        stored_filename=db_file.stored_filename,
        content_type=db_file.content_type,
        file_size=db_file.file_size,
        created_at=db_file.created_at,
    )


@router.get("/images/{file_id}", response_model=UploadedFileResponse)
async def get_file_metadata(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve file metadata.

    Requires authentication. Returns metadata for the specified file ID.
    Users can only access their own files.
    """
    db_file = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id)
        .first()
    )

    if db_file is None:
        raise HTTPException(status_code=404, detail="File not found")

    return UploadedFileResponse(
        id=db_file.id,
        user_id=db_file.user_id,
        original_filename=db_file.original_filename,
        stored_filename=db_file.stored_filename,
        content_type=db_file.content_type,
        file_size=db_file.file_size,
        created_at=db_file.created_at,
    )


@router.delete("/images/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an uploaded file.

    Requires authentication. Permanently deletes the physical file and
    removes the database metadata. Users can only delete their own files.
    """
    db_file = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id)
        .first()
    )

    if db_file is None:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete physical file
    storage_path = Path(db_file.storage_path)
    try:
        if storage_path.exists():
            storage_path.unlink()
    except OSError:
        pass  # Log error but continue with DB cleanup

    # Remove database metadata
    db.delete(db_file)
    db.commit()

    return {"detail": "File deleted successfully"}