"""Detection endpoints.

Handles the detection workflow:
- Receive a file reference
- Validate ownership
- Run ML prediction
- Run risk assessment
- Store detection record
- Return safe response
"""

from pathlib import Path
from decimal import Decimal, InvalidOperation
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Detection, User, Location, UploadedFile
from app.schemas.detection_request import DetectionRequest
from app.schemas.detection_response import DetectionResponse
from app.services.ml_service import run_prediction
from app.services.risk_service import assess_risk, get_risk_explanation, calculate_risk_from_prediction

router = APIRouter(prefix="/detections", tags=["detections"])


@router.post("/", response_model=DetectionResponse, status_code=status.HTTP_201_CREATED)
def create_detection(
    request: DetectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a detection workflow.

    1. Authenticate user.
    2. Validate request.
    3. Find uploaded file by ID.
    4. Verify ownership.
    5. Verify physical file exists.
    6. Create detection record with status=processing.
    7. Call ML service.
    8. Receive and normalize PredictionResult.
    9. Assess risk.
    10. Store prediction, confidence, risk level.
    11. Set status=completed.
    12. Return DetectionResponse.
    """
    # Step 1: Find the uploaded file
    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.id == request.file_id,
        UploadedFile.user_id == current_user.id,
    ).first()

    if uploaded_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or you don't have access to it",
        )

    # Step 2: Verify physical file exists
    file_path = Path(uploaded_file.storage_path)
    if not file_path.exists():
        # Set status to failed since the file is missing
        db_detection = Detection(
            user_id=current_user.id,
            uploaded_file_id=uploaded_file.id,
            input_type="image",
            input_reference=uploaded_file.stored_filename,
            prediction="",
            confidence=Decimal("0.0"),
            risk_level="unknown",
            status="failed",
        )
        db.add(db_detection)
        db.commit()
        db.refresh(db_detection)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on server",
        )

    # Step 3: Create detection record with status=processing
    db_detection = Detection(
        user_id=current_user.id,
        uploaded_file_id=uploaded_file.id,
        input_type="image",
        input_reference=uploaded_file.stored_filename,
        prediction="",
        confidence=Decimal("0.0"),
        risk_level="unknown",
        status="pending",
    )

    # Handle location if provided
    if request.latitude is not None and request.longitude is not None:
        loc = (
            db.query(Location)
            .filter(
                Location.latitude == request.latitude,
                Location.longitude == request.longitude,
            )
            .first()
        )
        if loc is None:
            loc = Location(
                latitude=request.latitude,
                longitude=request.longitude,
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
        db_detection.location_id = loc.id

    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)

    # Step 4: Call ML service
    try:
        ml_result = run_prediction(uploaded_file.storage_path)

        # Step 5: Extract prediction and confidence from ML result
        prediction = ml_result.get("prediction", "") if isinstance(ml_result, dict) else ""
        confidence = ml_result.get("confidence", Decimal("0.0")) if isinstance(ml_result, dict) else Decimal("0.0")

        # Step 6: Normalize confidence to Decimal
        if not isinstance(confidence, Decimal):
            try:
                confidence = Decimal(str(confidence))
            except (ValueError, InvalidOperation):
                confidence = Decimal("0.0")

        # Step 7: Assess risk using the risk service
        risk = calculate_risk_from_prediction(ml_result)

        # Step 8: Store prediction data and sonar parameters
        import json
        meta = ml_result.get("metadata", {}) if isinstance(ml_result, dict) else {}
        db_detection.prediction = prediction
        db_detection.confidence = risk["risk_score"]
        db_detection.risk_level = risk["risk_level"]
        db_detection.depth = meta.get("depth", 18.4)
        db_detection.range_m = meta.get("range_m", 48.5)
        db_detection.across_track_m = meta.get("across_track_m", 32.4)
        db_detection.along_track_m = meta.get("along_track_m", 16.1)
        db_detection.heading_deg = meta.get("heading_deg", 88.5)

        if "bounding_box" in meta and meta["bounding_box"]:
            db_detection.bounding_box = json.dumps(meta["bounding_box"])
        if "evidence" in meta and meta["evidence"]:
            db_detection.evidence = json.dumps(meta["evidence"])

        # Step 9: Set status to completed
        db_detection.status = "completed"
        db.commit()
        db.refresh(db_detection)

    except HTTPException:
        # ML failure or risk assessment issue - set status to failed
        db_detection.status = "failed"
        db.commit()
        db.refresh(db_detection)

    except Exception as e:
        # Unexpected error - set status to failed
        db_detection.status = "failed"
        db.commit()
        db.refresh(db_detection)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML prediction failed: {str(e)}",
        )

    # Step 10: Build detections list from ML result if available
    detections_list = []
    if isinstance(ml_result, dict) and "detections" in ml_result:
        for det in ml_result.get("detections", []):
            if isinstance(det, dict):
                detections_list.append(
                    {
                        "label": det.get("label", "unknown"),
                        "confidence": Decimal(str(det.get("confidence", "0.0"))),
                        "bbox": det.get("bbox"),
                    }
                )

    import json
    bbox_dict = None
    if db_detection.bounding_box:
        try:
            bbox_dict = json.loads(db_detection.bounding_box)
        except Exception:
            bbox_dict = None
    elif detections_list and len(detections_list) > 0:
        bbox_dict = detections_list[0].get("bbox")

    evidence_dict = None
    if db_detection.evidence:
        try:
            evidence_dict = json.loads(db_detection.evidence)
        except Exception:
            evidence_dict = None
    if not evidence_dict:
        evidence_dict = {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": True,
            "texture_characteristics": True,
        }

    # Step 11: Return DetectionResponse
    return DetectionResponse(
        id=db_detection.id,
        prediction=db_detection.prediction,
        confidence=db_detection.confidence,
        risk_level=db_detection.risk_level,
        risk_score=risk["risk_score"] if "risk" in locals() else db_detection.confidence,
        risk_reason=risk["risk_reason"] if "risk" in locals() else "Risk assessment completed",
        location_id=db_detection.location_id,
        latitude=float(request.latitude) if request.latitude is not None else None,
        longitude=float(request.longitude) if request.longitude is not None else None,
        status=db_detection.status,
        created_at=db_detection.created_at,
        detections=detections_list,
        uploaded_file_id=db_detection.uploaded_file_id,
        depth=float(db_detection.depth) if db_detection.depth is not None else 18.4,
        range_m=float(db_detection.range_m) if db_detection.range_m is not None else 48.5,
        along_track_m=float(db_detection.along_track_m) if db_detection.along_track_m is not None else 16.1,
        across_track_m=float(db_detection.across_track_m) if db_detection.across_track_m is not None else 32.4,
        heading_deg=float(db_detection.heading_deg) if db_detection.heading_deg is not None else 88.5,
        bounding_box=bbox_dict,
        evidence=evidence_dict,
    )


@router.get("/", response_model=dict)
def list_detections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    """List detections for the authenticated user.

    Pagination is supported with reasonable limits.
    """
    # Query detections for this user
    query = db.query(Detection).filter(Detection.user_id == current_user.id)

    total = query.count()

    # Apply pagination
    detections = query.offset((page - 1) * page_size).limit(page_size).all()

    # Build response
    items = []
    for det in detections:
        loc = (
            db.query(Location).filter(Location.id == det.location_id).first()
            if det.location_id
            else None
        )
        import json
        bbox_dict = None
        if det.bounding_box:
            try:
                bbox_dict = json.loads(det.bounding_box)
            except Exception:
                bbox_dict = None

        evidence_dict = None
        if det.evidence:
            try:
                evidence_dict = json.loads(det.evidence)
            except Exception:
                evidence_dict = None
        if not evidence_dict:
            evidence_dict = {
                "ai_detection": True,
                "acoustic_shadow": True,
                "shape_characteristics": True,
                "texture_characteristics": True,
            }

        items.append(
            {
                "id": det.id,
                "prediction": det.prediction,
                "confidence": float(det.confidence) if det.confidence else 0.0,
                "risk_level": det.risk_level,
                "risk_score": float(det.confidence) if det.confidence else 0.0,
                "risk_reason": get_risk_explanation(
                    det.risk_level, det.confidence, det.prediction
                ),
                "location_id": det.location_id,
                "latitude": float(loc.latitude) if loc and loc.latitude is not None else None,
                "longitude": float(loc.longitude) if loc and loc.longitude is not None else None,
                "status": det.status,
                "created_at": det.created_at,
                "uploaded_file_id": det.uploaded_file_id,
                "depth": float(det.depth) if det.depth is not None else 18.4,
                "range_m": float(det.range_m) if det.range_m is not None else 48.5,
                "along_track_m": float(det.along_track_m) if det.along_track_m is not None else 16.1,
                "across_track_m": float(det.across_track_m) if det.across_track_m is not None else 32.4,
                "heading_deg": float(det.heading_deg) if det.heading_deg is not None else 88.5,
                "bounding_box": bbox_dict,
                "evidence": evidence_dict,
            }
        )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/{detection_id}", response_model=DetectionResponse)
def get_detection(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single detection by ID.

    Verifies ownership before returning.
    """
    db_detection = (
        db.query(Detection)
        .filter(Detection.id == detection_id, Detection.user_id == current_user.id)
        .first()
    )

    if db_detection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found or you don't have access to it",
        )

    loc = (
        db.query(Location).filter(Location.id == db_detection.location_id).first()
        if db_detection.location_id
        else None
    )

    import json
    bbox_dict = None
    if db_detection.bounding_box:
        try:
            bbox_dict = json.loads(db_detection.bounding_box)
        except Exception:
            bbox_dict = None

    evidence_dict = None
    if db_detection.evidence:
        try:
            evidence_dict = json.loads(db_detection.evidence)
        except Exception:
            evidence_dict = None
    if not evidence_dict:
        evidence_dict = {
            "ai_detection": True,
            "acoustic_shadow": True,
            "shape_characteristics": True,
            "texture_characteristics": True,
        }

    return DetectionResponse(
        id=db_detection.id,
        prediction=db_detection.prediction,
        confidence=db_detection.confidence,
        risk_level=db_detection.risk_level,
        risk_score=float(db_detection.confidence) if db_detection.confidence else 0.0,
        risk_reason=get_risk_explanation(
            db_detection.risk_level, db_detection.confidence, db_detection.prediction
        ),
        location_id=db_detection.location_id,
        latitude=float(loc.latitude) if loc and loc.latitude is not None else None,
        longitude=float(loc.longitude) if loc and loc.longitude is not None else None,
        status=db_detection.status,
        created_at=db_detection.created_at,
        uploaded_file_id=db_detection.uploaded_file_id,
        depth=float(db_detection.depth) if db_detection.depth is not None else 18.4,
        range_m=float(db_detection.range_m) if db_detection.range_m is not None else 48.5,
        along_track_m=float(db_detection.along_track_m) if db_detection.along_track_m is not None else 16.1,
        across_track_m=float(db_detection.across_track_m) if db_detection.across_track_m is not None else 32.4,
        heading_deg=float(db_detection.heading_deg) if db_detection.heading_deg is not None else 88.5,
        bounding_box=bbox_dict,
        evidence=evidence_dict,
    )