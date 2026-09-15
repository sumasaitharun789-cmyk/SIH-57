"""FastAPI application entry point for the PulseDepth backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.error_handling import setup_error_handlers
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.rate_limit import _check_rate_limit, get_rate_limit_status

from app.api.routes import auth, files, detections, health, reports, dashboard, locations
from app.core.config import get_settings
from app.db.database import Base, engine
from app.middleware.error_handling import setup_error_handlers

settings = get_settings()


from app.db.database import Base, engine, migrate_sqlite_schema

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and apply migrations on startup."""
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_schema(engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="REST API for the PulseDepth project.",
    version="0.1.0",
    lifespan=lifespan,
)

# Development-friendly CORS: origins come from settings/.env.
# Default "*" allows the frontend to reach the backend during local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup centralized error handlers
setup_error_handlers(app)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(detections.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# Alias /api/analytics/summary to dashboard.analytics_summary
analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])
analytics_router.add_api_route("/summary", dashboard.analytics_summary, methods=["GET"])
app.include_router(analytics_router, prefix="/api")