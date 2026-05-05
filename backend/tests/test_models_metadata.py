"""ORM models register expected tables on Base.metadata."""

from __future__ import annotations

import app.models

from app.db.base import Base


def test_core_tables_registered() -> None:
    tables = Base.metadata.tables
    assert "users" in tables
    assert "jobs" in tables
    assert "applications" in tables
