"""String enums stored as VARCHAR (native_enum=False) for simple migrations."""

from __future__ import annotations

import enum


class UserRole(enum.StrEnum):
    MEMBER = "member"
    ADMIN = "admin"


class ApplicationStatus(enum.StrEnum):
    SAVED = "saved"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
