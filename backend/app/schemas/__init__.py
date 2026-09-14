"""Pydantic request/response schemas."""

from app.schemas.user import UserBase, UserCreate, UserResponse
from app.schemas.location import LocationBase, LocationCreate, LocationResponse
from app.schemas.detection import DetectionBase, DetectionCreate, DetectionResponse
from app.schemas.report import ReportBase, ReportCreate, ReportResponse
from app.schemas.upload import UploadedFileBase, UploadedFileCreate, UploadedFileResponse

# Prediction result schemas - imported lazily when needed
# to avoid circular import issues during package initialization
PredictionResult = None
DetectionResult = None

__all__ = [
    "UserBase",
    "UserCreate",
    "UserResponse",
    "LocationBase",
    "LocationCreate",
    "LocationResponse",
    "DetectionBase",
    "DetectionCreate",
    "DetectionResponse",
    "ReportBase",
    "ReportCreate",
    "ReportResponse",
    "UploadedFileBase",
    "UploadedFileCreate",
    "UploadedFileResponse",
]