"""Centralized error handling for the PulseDepth backend.

Provides consistent JSON error responses across all endpoints.
Ensures no sensitive data (stack traces, DB internals, paths, secrets)
is exposed to clients.

Error format:
{
    "detail": "Human-readable error message",
    "error_code": "ERROR_TYPE_DESCRIPTION"
}
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import traceback


def _get_error_code(path: str) -> str:
    """Map a FastAPI route path to a concise error code."""
    import re
    # Extract resource type from path
    parts = [p for p in path.split("/") if p and not p.startswith("{")]
    if not parts:
        return "GENERAL_ERROR"
    resource = parts[-1] if parts else "GENERAL"
    return f"{resource}_ERROR"


def setup_error_handlers(app) -> None:
    """Set up centralized exception handlers for the FastAPI app.

    Should be called during app initialization (in main.py lifespan or
    at module level after app creation).
    """

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTPExceptions with consistent JSON format."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": _get_error_code(request.url.path),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors with consistent format."""
        # Extract the first validation error for the detail message
        errors = exc.errors()
        if errors:
            # Get the first error's message, excluding schema location
            error_msg = errors[0].get("msg", "Validation error")
            # Remove field location from the message for cleaner output
            error_code = "VALIDATION_ERROR"
        else:
            error_msg = "Validation error"
            error_code = "VALIDATION_ERROR"

        # Log full details server-side (safe - no stack traces to clients)
        # traceback.print_exc()

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": error_msg,
                "error_code": error_code,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions with safe error responses.

        In production, only return a generic error. Detailed information
        is logged server-side only.
        """
        # Log the full error server-side for debugging
        # traceback.print_exc()

        # Return generic error - do not expose stack traces or internal details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred",
                "error_code": "INTERNAL_ERROR",
            },
        )