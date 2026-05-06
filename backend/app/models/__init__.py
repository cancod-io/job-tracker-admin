"""
SQLAlchemy ORM models (database shape).

Imported here so `Base.metadata` is complete for Alembic autogenerate.
"""

from __future__ import annotations

from app.models.application import Application
from app.models.company import Company
from app.models.enums import ApplicationStatus, UserRole
from app.models.job import Job
from app.models.user import User

__all__ = [
    "Application",
    "ApplicationStatus",
    "Company",
    "Job",
    "User",
    "UserRole",
]
