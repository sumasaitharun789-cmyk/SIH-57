"""Location and map data endpoints.

Provides geographic data storage, retrieval, and search.
Keeps geographic functionality independent from any specific frontend map library.
"""

from math import radians, cos, sin, sqrt, atan2
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Detection, Location, User
from app.schemas.location import LocationCreate, LocationResponse
from app.schemas.detection_response import DetectionResponse

router = APIRouter(prefix="/locations", tags=["locations"])


# Helper: Haversine distance calculation
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance in kilometers between two points.

    Uses the Haversine formula. Returns distance in km.
    """
    R = 6371.0  # Earth radius in kilometers

    lat1_r, lon1_r = radians(lat1), radians(lon1)
    lat2_r, lon2_r = radians(lat2), radians(lon2)

    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r

    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new location record.

    Authenticated users can create location records with validated coordinates.
    Coordinates are validated for range and for NaN/infinity values.

    - **latitude**: Latitude in degrees (-90 to 90)
    - **longitude**: Longitude in degrees (-180 to 180)
    - **location_name**: Optional descriptive name
    """
    # Check if location already exists with same coordinates
    existing = (
        db.query(Location)
        .filter(
            Location.latitude == location.latitude,
            Location.longitude == location.longitude,
        )
        .first()
    )

    if existing:
        return existing

    db_location = Location(
        latitude=location.latitude,
        longitude=location.longitude,
        location_name=location.location_name,
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


@router.get("/", response_model=dict)
def list_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    """List locations for the authenticated user.

    Returns locations relevant to the current user's detections.
    Pagination is supported with reasonable defaults.

    - **page**: Page number (1-indexed)
    - **page_size**: Number of items per page (max 100)
    """
    # Query locations that have detections by this user
    query = db.query(Location).join(Detection).filter(Detection.user_id == current_user.id)

    total = query.distinct(Location.id).count()

    locations = (
        query.distinct(Location.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for loc in locations:
        # Count detections at this location
        det_count = db.query(Detection).filter(Detection.location_id == loc.id).count()
        items.append(
            {
                "id": loc.id,
                "latitude": float(loc.latitude) if loc.latitude else None,
                "longitude": float(loc.longitude) if loc.longitude else None,
                "location_name": loc.location_name,
                "created_at": loc.created_at,
                "detection_count": det_count,
            }
        )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/detections", response_model=dict)
def list_detections_with_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    prediction: Optional[str] = Query(None, description="Filter by prediction class"),
    min_lat: Optional[float] = Query(
        None, ge=-90, le=90, description="Minimum latitude for bounding box"
    ),
    max_lat: Optional[float] = Query(
        None, ge=-90, le=90, description="Maximum latitude for bounding box"
    ),
    min_lon: Optional[float] = Query(
        None, ge=-180, le=180, description="Minimum longitude for bounding box"
    ),
    max_lon: Optional[float] = Query(
        None, ge=-180, le=180, description="Maximum longitude for bounding box"
    ),
):
    """List detections with their location data (map-ready format).

    Returns detection points with geographic data suitable for rendering
    on a map. Each item includes the detection ID, coordinates, prediction,
    confidence, and risk level.

    Supports optional filtering:
    - **risk_level**: Filter by risk level (low, medium, high, unknown)
    - **prediction**: Filter by prediction class name
    - **min_lat/max_lat/min_lon/max_lon**: Bounding box filter for map viewport

    Pagination is supported. Only the current user's permitted detections
    are returned.
    """
    # Base query: detections with their locations for this user
    query = (
        db.query(Detection, Location)
        .join(Location, Detection.location_id == Location.id)
        .filter(Detection.user_id == current_user.id)
    )

    # Apply bounding box filter if provided
    if min_lat is not None and max_lat is not None and min_lon is not None and max_lon is not None:
        if min_lat > max_lat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_lat must be less than or equal to max_lat",
            )
        if min_lon > max_lon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_lon must be less than or equal to max_lon",
            )
        query = query.filter(
            Location.latitude >= min_lat,
            Location.latitude <= max_lat,
            Location.longitude >= min_lon,
            Location.longitude <= max_lon,
        )

    # Apply risk level filter if provided
    if risk_level is not None:
        query = query.filter(Detection.risk_level == risk_level)

    # Apply prediction filter if provided
    if prediction is not None:
        query = query.filter(Detection.prediction == prediction)

    total = query.count()

    detections = (
        query.offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for det, loc in detections:
        risk_score = float(det.confidence) if det.confidence else 0.0
        items.append(
            {
                "detection_id": det.id,
                "latitude": float(loc.latitude) if loc.latitude else None,
                "longitude": float(loc.longitude) if loc.longitude else None,
                "prediction": det.prediction,
                "confidence": risk_score,
                "risk_level": det.risk_level.value if hasattr(det.risk_level, "value") else str(det.risk_level),
                "created_at": det.created_at,
            }
        )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/detections/nearby", response_model=dict)
def list_detections_nearby(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    latitude: float = Query(..., ge=-90, le=90, description="Reference latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Reference longitude"),
    radius_km: float = Query(
        ..., gt=0, le=500, description="Search radius in kilometers (max 500)"
    ),
    page: int = 1,
    page_size: int = 20,
):
    """List detections near a geographic point."""
    query = (
        db.query(Detection, Location)
        .join(Location, Detection.location_id == Location.id)
        .filter(Detection.user_id == current_user.id)
    )

    all_results = query.all()

    items = []
    for det, loc in all_results:
        if loc.latitude is None or loc.longitude is None:
            continue
        distance = haversine_km(latitude, longitude, float(loc.latitude), float(loc.longitude))
        if distance <= radius_km:
            risk_score = float(det.confidence) if det.confidence else 0.0
            items.append(
                {
                    "detection_id": det.id,
                    "latitude": float(loc.latitude),
                    "longitude": float(loc.longitude),
                    "prediction": det.prediction,
                    "confidence": risk_score,
                    "risk_level": det.risk_level.value if hasattr(det.risk_level, "value") else str(det.risk_level),
                    "created_at": det.created_at,
                    "distance_km": round(distance, 2),
                }
            )

    items.sort(key=lambda x: x.get("distance_km", float("inf")))

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    paged_items = items[start:end]

    return {
        "items": paged_items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single location by ID."""
    db_location = (
        db.query(Location)
        .join(Detection)
        .filter(Location.id == location_id, Detection.user_id == current_user.id)
        .first()
    )

    if db_location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found or you don't have access to it",
        )

    return db_location