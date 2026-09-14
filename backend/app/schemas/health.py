"""Schemas for the health check endpoint."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response returned by GET /api/health."""

    status: str
    service: str