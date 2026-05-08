"""Admin user directory and approval DTOs."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserApprovalStatus, UserRole


class AdminUserListItem(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    approval_status: UserApprovalStatus
    is_active: bool
    created_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    page: int
    page_size: int


class AdminUserApprovalPatch(BaseModel):
    approval_status: UserApprovalStatus = Field(
        description="Set to approved or rejected (pending is assigned at registration only).",
    )

    @field_validator("approval_status")
    @classmethod
    def not_pending(cls, value: UserApprovalStatus) -> UserApprovalStatus:
        if value == UserApprovalStatus.PENDING:
            raise ValueError("approval_status cannot be set back to pending")
        return value
