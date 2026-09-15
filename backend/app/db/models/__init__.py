"""Database ORM models with relationships.

Core entities:
- User: application users
- Location: geographic locations
- Detection: ML prediction results linked to users/locations
- Report: user-generated reports linked to detections
- UploadedFile: user-uploaded files with metadata

All models use the shared Base from app.db.database.
"""

from datetime import datetime
from pathlib import Path

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Enum as SQLEnum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.enums import DetectionStatus, InputType, ReportStatus, RiskLevel


class User(Base):
    """Application user (authentication handled in later steps)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    detections: Mapped[list["Detection"]] = relationship(
        "Detection", back_populates="user", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="user", cascade="all, delete-orphan"
    )
    uploaded_files: Mapped[list["UploadedFile"]] = relationship(
        "UploadedFile", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"


class Location(Base):
    """Geographic location for detections."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    latitude: Mapped[float] = mapped_column(Numeric(10, 8), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(11, 8), nullable=False)
    location_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    detections: Mapped[list["Detection"]] = relationship(
        "Detection", back_populates="location", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Location(id={self.id}, lat={self.latitude}, lon={self.longitude})>"


class Detection(Base):
    """ML detection/prediction result linked to a user and location."""

    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    uploaded_file_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("uploaded_files.id"), nullable=True, index=True)
    input_type: Mapped[InputType] = mapped_column(SQLEnum(InputType), default=InputType.OTHER, nullable=False)
    input_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)
    prediction: Mapped[str | None] = mapped_column(String(500), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(SQLEnum(RiskLevel), default=RiskLevel.UNKNOWN, nullable=False)
    status: Mapped[DetectionStatus] = mapped_column(SQLEnum(DetectionStatus), default=DetectionStatus.PENDING, nullable=False)
    depth: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    range_m: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    along_track_m: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    across_track_m: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    heading_deg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    bounding_box: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="detections")
    location: Mapped["Location | None"] = relationship("Location", back_populates="detections")
    uploaded_file: Mapped["UploadedFile | None"] = relationship("UploadedFile")
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="detection", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Detection(id={self.id}, user_id={self.user_id}, status={self.status.value})>"


class Report(Base):
    """User-generated report linked to a detection."""

    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    detection_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("detections.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reports")
    detection: Mapped["Detection | None"] = relationship("Detection", back_populates="reports")

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, user_id={self.user_id}, status={self.status.value})>"


class UploadedFile(Base):
    """User-uploaded file metadata (binary stored on local filesystem, not in SQLite).

    The actual file binary is stored on the local filesystem under the configured
    upload directory. This model only tracks metadata and associates the file
    with the uploading user.
    """

    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Numeric(10, 2), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="uploaded_files")

    def __repr__(self) -> str:
        return f"<UploadedFile(id={self.id}, user_id={self.user_id}, stored_filename={self.stored_filename})>"