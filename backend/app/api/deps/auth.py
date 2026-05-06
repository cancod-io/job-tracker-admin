"""Authentication dependencies for protected routes."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
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
    return user
