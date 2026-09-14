"""Tests for database models and relationships."""

from decimal import Decimal

from sqlalchemy import text

from app.db.enums import DetectionStatus, InputType, ReportStatus, RiskLevel
from app.db.models import Detection, Location, Report, User
from tests.test_database import TestDB


def test_database_connection() -> None:
    """Test that database connection and table creation works."""
    with TestDB() as db:
        # If we can create tables and get a session, connection works
        assert db is not None
        # Verify tables exist by querying
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = [row[0] for row in result.fetchall()]
        assert "users" in tables
        assert "locations" in tables
        assert "detections" in tables
        assert "reports" in tables


def test_location_crud() -> None:
    """Test Location insert and retrieve."""
    with TestDB() as db:
        location = Location(
            latitude=12.9716,
            longitude=77.5946,
            location_name="Bangalore"
        )
        db.add(location)
        db.commit()
        db.refresh(location)

        assert location.id is not None
        # Compare Decimal values - convert to float for comparison
        assert float(location.latitude) == 12.9716
        assert float(location.longitude) == 77.5946
        assert location.location_name == "Bangalore"

        # Retrieve
        retrieved = db.query(Location).filter_by(id=location.id).first()
        assert retrieved is not None
        assert retrieved.location_name == "Bangalore"


def test_user_crud() -> None:
    """Test User insert and retrieve."""
    with TestDB() as db:
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_pw_placeholder"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True

        retrieved = db.query(User).filter_by(id=user.id).first()
        assert retrieved is not None
        assert retrieved.username == "testuser"


def test_detection_with_location() -> None:
    """Test Detection associated with a Location."""
    with TestDB() as db:
        # Create location
        location = Location(latitude=28.6139, longitude=77.2090, location_name="Delhi")
        db.add(location)
        db.commit()
        db.refresh(location)

        # Create user
        user = User(username="detect_user", email="detect@example.com", hashed_password="pw")
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create detection
        detection = Detection(
            user_id=user.id,
            location_id=location.id,
            input_type=InputType.IMAGE,
            input_reference="img_123.jpg",
            prediction="person",
            confidence=0.95,
            risk_level=RiskLevel.HIGH,
            status=DetectionStatus.COMPLETED,
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)

        assert detection.id is not None
        assert detection.user_id == user.id
        assert detection.location_id == location.id
        assert detection.status == DetectionStatus.COMPLETED
        assert detection.risk_level == RiskLevel.HIGH

        # Verify relationships
        assert detection.user.username == "detect_user"
        assert detection.location.location_name == "Delhi"

        # Reverse relationships
        assert len(user.detections) == 1
        assert user.detections[0].id == detection.id
        assert len(location.detections) == 1
        assert location.detections[0].id == detection.id


def test_report_relationships() -> None:
    """Test Report linked to User and Detection."""
    with TestDB() as db:
        # Setup: user, location, detection
        user = User(username="reporter", email="reporter@example.com", hashed_password="pw")
        db.add(user)
        db.commit()
        db.refresh(user)

        location = Location(latitude=19.0760, longitude=72.8777, location_name="Mumbai")
        db.add(location)
        db.commit()
        db.refresh(location)

        detection = Detection(
            user_id=user.id,
            location_id=location.id,
            input_type=InputType.VIDEO,
            input_reference="vid_456.mp4",
            prediction="vehicle",
            confidence=0.87,
            risk_level=RiskLevel.MEDIUM,
            status=DetectionStatus.COMPLETED,
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)

        # Create report
        report = Report(
            user_id=user.id,
            detection_id=detection.id,
            title="Traffic violation",
            description="Saw a car running red light",
            status=ReportStatus.PENDING,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        assert report.id is not None
        assert report.user_id == user.id
        assert report.detection_id == detection.id

        # Verify relationships
        assert report.user.username == "reporter"
        assert report.detection.prediction == "vehicle"

        # Reverse relationships
        assert len(user.reports) == 1
        assert user.reports[0].id == report.id
        assert len(detection.reports) == 1
        assert detection.reports[0].id == report.id


def test_detection_without_report() -> None:
    """Test Detection can exist without a Report."""
    with TestDB() as db:
        user = User(username="noreport", email="noreport@example.com", hashed_password="pw")
        location = Location(latitude=13.0827, longitude=80.2707, location_name="Chennai")
        db.add_all([user, location])
        db.commit()
        db.refresh(user)
        db.refresh(location)

        detection = Detection(
            user_id=user.id,
            location_id=location.id,
            input_type=InputType.TEXT,
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)

        assert len(detection.reports) == 0
        assert detection.status == DetectionStatus.PENDING  # default
        assert detection.risk_level == RiskLevel.UNKNOWN  # default


def test_report_without_detection() -> None:
    """Test Report can exist without a linked Detection."""
    with TestDB() as db:
        user = User(username="standalone", email="standalone@example.com", hashed_password="pw")
        db.add(user)
        db.commit()
        db.refresh(user)

        report = Report(
            user_id=user.id,
            detection_id=None,
            title="General observation",
            description="No specific detection",
            status=ReportStatus.PENDING,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        assert report.detection_id is None
        assert report.detection is None
        assert len(user.reports) == 1