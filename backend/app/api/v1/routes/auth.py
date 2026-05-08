"""Authentication endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import is_auth
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.enums import UserApprovalStatus
from app.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthUserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthUserResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise AppError(
            "Email already registered",
            status_code=status.HTTP_409_CONFLICT,
            code="EMAIL_EXISTS",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        approval_status=UserApprovalStatus.PENDING,
    )
    db.add(user)
    await db.flush()
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        approval_status=user.approval_status,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise AppError(
            "Invalid credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )

    if user.approval_status == UserApprovalStatus.PENDING:
        raise AppError(
            "Your account is waiting for administrator approval before you can sign in.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="PENDING_APPROVAL",
        )
    if user.approval_status == UserApprovalStatus.REJECTED:
        raise AppError(
            "Your registration was not approved. Contact support if you believe this is an error.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_REJECTED",
        )

    token = create_access_token(subject=str(user.id), extra_claims={"email": user.email})
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=AuthUserResponse)
async def me(current_user: Annotated[User, Depends(is_auth)]) -> AuthUserResponse:
    return AuthUserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        approval_status=current_user.approval_status,
    )
