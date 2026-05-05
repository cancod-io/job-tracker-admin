"""Central error handlers return a stable JSON envelope."""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

from app.core.error_handlers import register_error_handlers
from app.core.exceptions import AppError


@pytest.mark.asyncio
async def test_app_error_envelope() -> None:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/boom")
    async def _boom() -> None:
        raise AppError("Not allowed", status_code=403, code="FORBIDDEN_ACTION", details={"id": 1})

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/boom")
    assert resp.status_code == 403
    data = resp.json()
    assert data["error"]["code"] == "FORBIDDEN_ACTION"
    assert data["error"]["message"] == "Not allowed"
    assert data["error"]["details"] == {"id": 1}


@pytest.mark.asyncio
async def test_http_exception_envelope() -> None:
    from starlette.exceptions import HTTPException

    app = FastAPI()
    register_error_handlers(app)

    @app.get("/missing")
    async def _missing() -> None:
        raise HTTPException(status_code=404, detail="Nothing here")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/missing")
    assert resp.status_code == 404
    data = resp.json()
    assert data["error"]["code"] == "NOT_FOUND"
    assert data["error"]["message"] == "Nothing here"


@pytest.mark.asyncio
async def test_validation_error_envelope() -> None:
    class Body(BaseModel):
        name: str

    app = FastAPI()
    register_error_handlers(app)

    @app.post("/echo")
    async def _echo(body: Body) -> Body:
        return body

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/echo", json={})
    assert resp.status_code == 422
    data = resp.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
    assert isinstance(data["error"]["details"], list)


@pytest.mark.asyncio
async def test_unhandled_error_dev_message() -> None:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/panic")
    async def _panic() -> None:
        raise RuntimeError("boom")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/panic")
    assert resp.status_code == 500
    data = resp.json()
    assert data["error"]["code"] == "INTERNAL_ERROR"
    assert "boom" in data["error"]["message"]
