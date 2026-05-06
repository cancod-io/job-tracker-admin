"""String enums stored as VARCHAR (native_enum=False) for simple migrations."""

from __future__ import annotations

import enum


class UserRole(enum.StrEnum):
    MEMBER = "member"
    ADMIN = "admin"


class ApplicationStatus(enum.StrEnum):
    """Stored in PostgreSQL as type `application_status`."""

    NEW = "new"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    REJECTED = "rejected"
