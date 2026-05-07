"""
FastAPI application factory + lifespan.

Product code for auth, jobs, applications, etc. lives under `app/`.
Sibling folders at the repo root (`job-api-service/`, `scraping-service/`,
`user-api-service/`) are separate deployable services; scraping code lives under
`scraping-service/app/scrapers/`.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.bootstrap import apply_common_http_stack, db_lifespan
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=db_lifespan,
    )

    apply_common_http_stack(app)
    app.include_router(api_v1_router)

    @app.get("/health", tags=["meta"], summary="Liveness probe")
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
