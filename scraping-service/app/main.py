"""Scraping service admin API with role-gated operational endpoints."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Annotated, Any, Literal

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

Role = Literal["admin", "moderator", "user"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SCRAPING_", extra="ignore")
    service_name: str = "scraping-service"
    version: str = "0.1.0"
    jwt_secret: str = "change-me-at-least-32-characters"
    jwt_algorithm: str = "HS256"


settings = Settings()

# In-memory logs until DB integration is wired into this service.
_SCRAPER_LOGS: list[dict[str, Any]] = []


class ScraperRunRequest(BaseModel):
    scraper_name: str = Field(min_length=2, max_length=120)
    duration: float = Field(default=0.0, ge=0.0)
    status: Literal["queued", "running", "success", "failed"] = "queued"
    error_message: str | None = None


def describe() -> dict[str, str]:
    """Useful for process managers / compose healthchecks."""
    return {"service": settings.service_name, "version": settings.version}


def _extract_bearer_token(authorization: str | None) -> str:
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return token


def _get_current_claims(authorization: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    role = payload.get("role")
    if role not in {"admin", "moderator", "user"}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing role")
    return payload


def require_roles(*allowed: Role) -> Callable[[dict[str, Any]], dict[str, Any]]:
    allowed_set = set(allowed)

    def _dependency(
        claims: Annotated[dict[str, Any], Depends(_get_current_claims)],
    ) -> dict[str, Any]:
        role = claims["role"]
        if role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return claims

    return _dependency


def create_app() -> FastAPI:
    app = FastAPI(
        title="Shopify Job Tracker — Scraping Service",
        version=settings.version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.service_name, "version": settings.version}

    # Moderator can monitor and trigger operational runs.
    @app.get("/api/v1/admin/scrapers/logs")
    async def list_scraper_logs(
        _claims: Annotated[dict[str, Any], Depends(require_roles("admin", "moderator"))],
    ) -> dict[str, Any]:
        return {"count": len(_SCRAPER_LOGS), "items": _SCRAPER_LOGS[-100:]}

    @app.post("/api/v1/admin/scrapers/run")
    async def trigger_scraper_run(
        payload: ScraperRunRequest,
        claims: Annotated[dict[str, Any], Depends(require_roles("admin", "moderator"))],
    ) -> dict[str, Any]:
        log_item = {
            "id": len(_SCRAPER_LOGS) + 1,
            "scraper_name": payload.scraper_name,
            "status": payload.status,
            "error_message": payload.error_message,
            "duration": payload.duration,
            "timestamp": datetime.now(UTC).isoformat(),
            "triggered_by": claims["role"],
        }
        _SCRAPER_LOGS.append(log_item)
        return log_item

    # Admin-only critical configuration endpoint.
    @app.post("/api/v1/admin/scrapers/config")
    async def update_scraper_config(
        config: dict[str, Any],
        claims: Annotated[dict[str, Any], Depends(require_roles("admin"))],
    ) -> dict[str, Any]:
        return {
            "updated": True,
            "updated_by": claims["role"],
            "config": config,
        }

    return app


app = create_app()
