"""Authentication dependencies for protected routes."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

import jwt
from fastapi import Depends, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import UserApprovalStatus, UserRole
from app.models.user import User


def _extract_bearer_token(authorization: str | None) -> str:
    if authorization is None:
        raise AppError(
            "Missing Authorization header",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError(
            "Invalid authorization scheme",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )
    return token


async def is_auth(
    db: Annotated[AsyncSession, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Verify JWT bearer token and return the current user."""
    token = _extract_bearer_token(authorization)
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError as exc:
        raise AppError(
            "Invalid or expired token",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        ) from exc

    subject = payload.get("sub")
    if not subject:
        raise AppError(
            "Token missing subject",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )

    result = await db.execute(select(User).where(User.id == int(subject)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise AppError(
            "User not found or inactive",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )
    if user.approval_status == UserApprovalStatus.PENDING:
        raise AppError(
            "Your account is waiting for administrator approval before you can use the API.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="PENDING_APPROVAL",
        )
    if user.approval_status == UserApprovalStatus.REJECTED:
        raise AppError(
            "Your registration was not approved.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_REJECTED",
        )
    return user


def require_roles(*allowed_roles: UserRole) -> Callable[[User], Awaitable[User]]:
    """Factory dependency to enforce role-based access controls in routes."""
    allowed = set(allowed_roles)

    async def _dependency(current_user: Annotated[User, Depends(is_auth)]) -> User:
        if current_user.role not in allowed:
            raise AppError(
                "Insufficient permissions for this action",
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
            )
        return current_user

    return _dependency
