"""Admin-only user directory and approval actions."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_roles
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.enums import UserApprovalStatus, UserRole
from app.models.user import User
from app.schemas.admin_users import AdminUserApprovalPatch, AdminUserListItem, AdminUserListResponse

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

RequireAdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.get("", response_model=AdminUserListResponse)
async def list_users(
    _: RequireAdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
    approval_status: Annotated[UserApprovalStatus | None, Query()] = None,
) -> AdminUserListResponse:
    count_base = select(func.count()).select_from(User)
    list_base = select(User)
    if approval_status is not None:
        count_base = count_base.where(User.approval_status == approval_status)
        list_base = list_base.where(User.approval_status == approval_status)

    total_result = await db.execute(count_base)
    total = int(total_result.scalar_one())

    list_stmt = (
        list_base.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(list_stmt)
    rows = result.scalars().unique().all()

    return AdminUserListResponse(
        items=[
            AdminUserListItem(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                approval_status=u.approval_status,
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/{user_id}/approval", response_model=AdminUserListItem)
async def patch_user_approval(
    user_id: int,
    payload: AdminUserApprovalPatch,
    admin_user: RequireAdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AdminUserListItem:
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise AppError(
            "User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )

    previous = target.approval_status
    target.approval_status = payload.approval_status
    await db.flush()

    db.add(
        AuditLog(
            actor_user_id=admin_user.id,
            action="user.approval_status.changed",
            target_type="user",
            target_id=str(target.id),
            details={
                "from": previous.value,
                "to": payload.approval_status.value,
            },
        )
    )

    return AdminUserListItem(
        id=target.id,
        email=target.email,
        full_name=target.full_name,
        role=target.role,
        approval_status=target.approval_status,
        is_active=target.is_active,
        created_at=target.created_at,
    )
