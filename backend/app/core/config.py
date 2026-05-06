"""
Application settings loaded from environment variables.

We use `pydantic-settings` so every env var is validated and typed,
and a single `settings` singleton is imported everywhere else.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "Shopify Job Tracker API"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated browser origins allowed by CORS.",
    )

    database_url: str = "postgresql+asyncpg://sjt:sjt@localhost:5432/shopify_job_tracker"
    database_url_sync: str = "postgresql+psycopg://sjt:sjt@localhost:5432/shopify_job_tracker"
    db_pool_size: int = 10
    db_max_overflow: int = 5
    db_pool_timeout: int = 30
    db_echo: bool = False

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 14

    rapidapi_key: str | None = None
    jsearch_host: str = "jsearch.p.rapidapi.com"

    scrape_cron_hours: int = 2
    scrape_on_startup: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Origins as a list for `CORSMiddleware` / callers."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton settings instance."""
    return Settings()


settings = get_settings()
