"""User API service with role-gated admin endpoints."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Literal, TypedDict

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

Role = Literal["admin", "moderator", "user"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="USER_API_", extra="ignore")
    app_name: str = "Shopify Job Tracker — User API"
    app_version: str = "0.1.0"
    jwt_secret: str = "change-me-at-least-32-characters"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60


settings = Settings()


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role: Role = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: Role


class UserRow(TypedDict):
    id: int
    email: str
    full_name: str
    password: str
    role: Role


# Temporary in-memory store until DB extraction from backend is complete.
_USERS: list[UserRow] = [
    {
        "id": 1,
        "email": "admin@local.dev",
        "full_name": "System Admin",
        "password": "AdminPass123!",
        "role": "admin",
    },
    {
        "id": 2,
        "email": "mod@local.dev",
        "full_name": "Core Moderator",
        "password": "ModeratorPass123!",
        "role": "moderator",
    },
]


def _create_access_token(*, subject: str, role: Role, email: str) -> str:
    exp = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": subject,
        "role": role,
        "email": email,
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _extract_bearer_token(authorization: str | None) -> str:
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return token


def _get_current_claims(authorization: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    role = payload.get("role")
    if role not in {"admin", "moderator", "user"}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing role")
    return payload


def require_roles(*allowed: Role) -> Callable[[dict[str, Any]], dict[str, Any]]:
    allowed_set = set(allowed)

    def _dependency(claims: Annotated[dict[str, Any], Depends(_get_current_claims)]) -> dict[str, Any]:
        role = claims["role"]
        if role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return claims

    return _dependency


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "user-api-service", "version": settings.app_version}

    @app.post("/api/v1/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
    async def register(payload: RegisterRequest) -> UserOut:
        if any(user["email"] == payload.email for user in _USERS):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        new_id = max((user["id"] for user in _USERS), default=0) + 1
        row: UserRow = {
            "id": new_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "password": payload.password,
            "role": payload.role,
        }
        _USERS.append(row)
        return UserOut(id=row["id"], email=row["email"], full_name=row["full_name"], role=row["role"])

    @app.post("/api/v1/auth/login", response_model=TokenResponse)
    async def login(payload: LoginRequest) -> TokenResponse:
        user = next(
            (
                row
                for row in _USERS
                if row["email"] == payload.email and row["password"] == payload.password
            ),
            None,
        )
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = _create_access_token(
            subject=str(user["id"]),
            role=user["role"],
            email=user["email"],
        )
        return TokenResponse(
            access_token=token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    @app.get("/api/v1/auth/me")
    async def me(claims: Annotated[dict[str, Any], Depends(_get_current_claims)]) -> dict[str, Any]:
        return {
            "id": claims["sub"],
            "email": claims["email"],
            "role": claims["role"],
        }

    # ----- Admin / moderator role-gated endpoints -----
    @app.get("/api/v1/admin/users", response_model=list[UserOut])
    async def admin_list_users(
        _claims: Annotated[dict[str, Any], Depends(require_roles("admin"))],
    ) -> list[UserOut]:
        return [
            UserOut(id=row["id"], email=row["email"], full_name=row["full_name"], role=row["role"])
            for row in _USERS
        ]

    @app.patch("/api/v1/admin/users/{user_id}/role", response_model=UserOut)
    async def admin_update_user_role(
        user_id: int,
        role: Role,
        _claims: Annotated[dict[str, Any], Depends(require_roles("admin"))],
    ) -> UserOut:
        for row in _USERS:
            if row["id"] == user_id:
                row["role"] = role
                return UserOut(
                    id=row["id"],
                    email=row["email"],
                    full_name=row["full_name"],
                    role=row["role"],
                )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    @app.get("/api/v1/admin/activity")
    async def admin_or_moderator_activity(
        claims: Annotated[dict[str, Any], Depends(require_roles("admin", "moderator"))],
    ) -> dict[str, Any]:
        return {
            "message": "Activity overview visible to admin/moderator",
            "viewer_role": claims["role"],
            "total_users": len(_USERS),
        }

    @app.get("/api/v1/admin/system-config")
    async def admin_system_config(
        _claims: Annotated[dict[str, Any], Depends(require_roles("admin"))],
    ) -> dict[str, Any]:
        return {
            "job_sources_editable": True,
            "api_integrations_editable": True,
            "user_management_editable": True,
        }

    return app


app = create_app()
