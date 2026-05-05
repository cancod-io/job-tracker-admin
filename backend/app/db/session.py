"""
Async SQLAlchemy engine + session factory.

The engine is created lazily and reused for the entire app lifetime.
Use `get_db()` as a FastAPI dependency to get a per-request session.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

_engine: AsyncEngine | None = None
_SessionFactory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return the singleton async engine, creating it on first call."""
    global _engine, _SessionFactory
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.db_echo,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_pre_ping=True,
            future=True,
        )
        _SessionFactory = async_sessionmaker(
            bind=_engine,
            expire_on_commit=False,
            autoflush=False,
        )
    return _engine


async def dispose_engine() -> None:
    """Close all pooled connections. Called on app shutdown."""
    global _engine, _SessionFactory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _SessionFactory = None


async def get_db() -> AsyncIterator[AsyncSession]:
    """
    FastAPI dependency: yield a session, commit on success, rollback on error.

    Usage:
        @router.get("/things")
        async def list_things(db: Annotated[AsyncSession, Depends(get_db)]):
            ...
    """
    if _SessionFactory is None:
        get_engine()
    assert _SessionFactory is not None

    async with _SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
