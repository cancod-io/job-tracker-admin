"""Security utilities + middleware behavior."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.main import create_app


def test_password_hashing_roundtrip() -> None:
    plain = "super-secret-123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed)


def test_jwt_roundtrip_contains_subject() -> None:
    token = create_access_token(subject="42", extra_claims={"email": "person@example.com"})
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["email"] == "person@example.com"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_security_headers_on_health() -> None:
    app = create_app()
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["x-frame-options"] == "DENY"
    assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_protected_route_requires_auth_header() -> None:
    app = create_app()
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"
