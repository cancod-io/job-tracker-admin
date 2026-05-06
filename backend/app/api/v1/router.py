"""Compose all v1 routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
