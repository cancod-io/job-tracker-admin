"""Smoke + role-gated scraping admin endpoint tests."""

from __future__ import annotations

import jwt
from fastapi.testclient import TestClient

from app.main import create_app, describe, settings


def test_describe() -> None:
    body = describe()
    assert body["service"] == "scraping-service"
    assert "version" in body


def _token(role: str) -> str:
    return jwt.encode({"sub": "1", "role": role}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def test_moderator_can_run_scraper_but_not_edit_config() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)
    mod_token = _token("moderator")

    run = client.post(
        "/api/v1/admin/scrapers/run",
        json={"scraper_name": "remoteok", "duration": 0.2, "status": "queued"},
        headers={"Authorization": f"Bearer {mod_token}"},
    )
    assert run.status_code == 200
    assert run.json()["scraper_name"] == "remoteok"

    cfg = client.post(
        "/api/v1/admin/scrapers/config",
        json={"max_workers": 5},
        headers={"Authorization": f"Bearer {mod_token}"},
    )
    assert cfg.status_code == 403


def test_admin_can_edit_scraper_config() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)
    admin_token = _token("admin")
    cfg = client.post(
        "/api/v1/admin/scrapers/config",
        json={"max_workers": 7},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert cfg.status_code == 200
    assert cfg.json()["updated"] is True
