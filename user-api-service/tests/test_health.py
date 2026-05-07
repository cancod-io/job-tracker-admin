"""User API smoke + role-gated admin endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_health() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "user-api-service"


def _login(client: TestClient, *, email: str, password: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_admin_endpoints_are_role_gated() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)

    admin_token = _login(client, email="admin@local.dev", password="AdminPass123!")
    mod_token = _login(client, email="mod@local.dev", password="ModeratorPass123!")

    admin_list = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_list.status_code == 200
    assert len(admin_list.json()) >= 2

    mod_list = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {mod_token}"},
    )
    assert mod_list.status_code == 403

    mod_activity = client.get(
        "/api/v1/admin/activity",
        headers={"Authorization": f"Bearer {mod_token}"},
    )
    assert mod_activity.status_code == 200
