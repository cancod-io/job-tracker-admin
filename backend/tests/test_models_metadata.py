"""ORM models register expected tables on Base.metadata."""

from __future__ import annotations

import importlib

from app.db.base import Base


def test_core_tables_registered() -> None:
    importlib.import_module("app.models")
    tables = Base.metadata.tables
    assert "users" in tables
    assert "companies" in tables
    assert "jobs" in tables
    assert "applications" in tables
    assert "scraper_logs" in tables
    assert "audit_logs" in tables
