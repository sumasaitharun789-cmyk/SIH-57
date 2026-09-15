"""SQLAlchemy engine and session setup.

Kept separate from API routes so the storage layer can be swapped later
(e.g. PostgreSQL) by only changing DATABASE_URL.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine_options: dict = {}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_options)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models (added in later steps)."""


def migrate_sqlite_schema(db_engine):
    """Safely ensure new optional columns exist in existing SQLite database."""
    if not str(db_engine.url).startswith("sqlite"):
        return
    with db_engine.connect() as conn:
        from sqlalchemy import text
        try:
            cursor = conn.execute(text("PRAGMA table_info(detections)"))
            existing_cols = {row[1] for row in cursor.fetchall()}
            if not existing_cols:
                return

            columns_to_add = [
                ("depth", "REAL"),
                ("range_m", "REAL"),
                ("along_track_m", "REAL"),
                ("across_track_m", "REAL"),
                ("heading_deg", "REAL"),
                ("bounding_box", "TEXT"),
                ("evidence", "TEXT"),
            ]
            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE detections ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
        except Exception:
            pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()