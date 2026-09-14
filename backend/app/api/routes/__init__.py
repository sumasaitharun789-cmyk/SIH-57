"""REST API route modules.

Registered routes are included in app/main.py.
"""
from app.api.routes.auth import router as auth_router
from app.api.routes.files import router as files_router
from app.api.routes.detections import router as detections_router
from app.api.routes.health import router as health_router
from app.api.routes.reports import router as reports_router

__all__ = [
    "auth_router",
    "files_router",
    "detections_router",
    "health_router",
    "reports_router",
]