"""Security headers middleware for the PulseDepth backend.

Adds reasonable security-related HTTP response headers where appropriate.

Headers added:
- X-Content-Type-Options: nosniff — Prevents MIME-type sniffing
- X-Frame-Options: DENY — Prevents clickjacking
- Referrer-Policy: no-referrer — Limits referrer information sent

Do not add headers that interfere with normal API behavior.
Do not pretend these headers replace proper authentication or authorization.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that adds security headers to all responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response