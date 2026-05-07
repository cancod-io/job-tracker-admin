"""HTTP API for job discovery, listing, and ingestion hooks (extract from `backend` over time)."""

from __future__ import annotations

from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="JOB_API_", extra="ignore")
    app_name: str = "Shopify Job Tracker — Job API"
    app_version: str = "0.1.0"


settings = Settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "job-api-service", "version": settings.app_version}

    return app


app = create_app()
