"""Test database setup and helpers.

Provides an isolated SQLite in-memory database for tests.
"""

from contextlib import contextmanager
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base


# Use an in-memory SQLite database for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def create_test_tables() -> None:
    """Create all tables in the test database."""
    Base.metadata.create_all(bind=test_engine)


def drop_test_tables() -> None:
    """Drop all tables in the test database."""
    Base.metadata.drop_all(bind=test_engine)


@contextmanager
def get_test_db() -> Generator[Session, None, None]:
    """Provide a test database session."""
    db = TestingSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


class TestDB:
    """Test database context manager for pytest fixtures."""

    def __enter__(self) -> Session:
        create_test_tables()
        self.db = TestingSessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is not None:
            self.db.rollback()
        else:
            self.db.commit()
        self.db.close()
        drop_test_tables()