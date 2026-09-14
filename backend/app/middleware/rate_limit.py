"""Lightweight in-memory rate limiting for the PulseDepth backend.

Provides simple rate protection for potentially abused endpoints.
Note: This is process-local and reset when the application restarts.
Not suitable as distributed production infrastructure.

Recommended for SIH prototype only - not a replacement for enterprise
rate limiting infrastructure (Redis, dedicated services, etc.).
"""

# Rate limit counters: {client_ip: {"count": int, "reset_at": datetime}}
_rate_limits: dict = {}

# Default rate limits
DEFAULT_RATE_LIMITS = {
    "registration": {"timespan_seconds": 60, "max_requests": 5},
    "login": {"timespan_seconds": 60, "max_requests": 10},
    "image_upload": {"timespan_seconds": 60, "max_requests": 3},
    "detection": {"timespan_seconds": 60, "max_requests": 5},
    "default": {"timespan_seconds": 60, "max_requests": 30},
}


def _get_client_ip(request) -> str:
    """Get the client IP address from the request."""
    # Check for proxy headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the leftmost IP (original client)
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(request, key: str, limit_config: dict) -> bool:
    """Check if the request is within rate limits.

    Returns True if allowed, False if rate limit exceeded.
    """
    now = __import__("datetime").datetime.utcnow()
    ip = _get_client_ip(request)

    if ip not in _rate_limits:
        _rate_limits[ip] = {"count": 0, "reset_at": now}

    # Reset counter if past the timespan
    if (_rate_limits[ip]["reset_at"] - now).total_seconds() > limit_config["timespan_seconds"]:
        _rate_limits[ip] = {"count": 0, "reset_at": now}

    _rate_limits[ip]["count"] += 1

    if _rate_limits[ip]["count"] > limit_config["max_requests"]:
        # Reset counter after a grace period
        _rate_limits[ip]["reset_at"] = now + __import__("datetime").timedelta(seconds=limit_config["timespan_seconds"])
        return False

    return True


def get_rate_limit_status(request, key: str, limit_config: dict) -> dict:
    """Get rate limit status information.

    Returns current count and whether the request is allowed.
    """
    now = __import__("datetime").datetime.utcnow()
    ip = _get_client_ip(request)

    if ip not in _rate_limits:
        return {"count": 0, "max": limit_config["max_requests"],
                "remaining": limit_config["max_requests"], "reset": None}

    time_until_reset = (_rate_limits[ip]["reset_at"] - now).total_seconds()
    return {
        "count": _rate_limits[ip]["count"],
        "max": limit_config["max_requests"],
        "remaining": max(0, limit_config["max_requests"] - _rate_limits[ip]["count"]),
        "reset": round(time_until_reset, 1) if time_until_reset > 0 else 0,
    }