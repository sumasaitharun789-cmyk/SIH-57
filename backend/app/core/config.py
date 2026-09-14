"""Application settings loaded from environment variables / .env file.

Values can be overridden without changing code (e.g. APP_NAME, DATABASE_URL).
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the PulseDepth backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PulseDepth Backend"
    debug: bool = False
    database_url: str = "sqlite:///./pulsedepth.db"
    cors_origins: list[str] | str = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10
    ml_model: str = "mock"
    ml_model_path: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        """Accept a comma-separated string or JSON list from the .env file."""
        if isinstance(value, str):
            val_str = value.strip()
            if val_str.startswith("[") and val_str.endswith("]"):
                import json
                try:
                    parsed = json.loads(val_str)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in val_str.split(",") if origin.strip()]
        elif isinstance(value, (list, tuple)):
            return [str(x).strip() for x in value if str(x).strip()]
        return ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()