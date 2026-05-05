"""
Alembic environment script.

- Reads the SYNC database URL from `settings.database_url_sync` (i.e. the
  `DATABASE_URL_SYNC` env var) so we don't depend on asyncpg here.
- Imports `Base.metadata` from `app.db.base` for autogenerate support.
- When new ORM models are added under `app/models/`, import them inside
  `_load_models()` so Alembic sees them on `--autogenerate`.
"""

from __future__ import annotations

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.database_url_sync)


def _load_models() -> None:
    """
    Import all ORM models so they register with `Base.metadata`.

    Add new model modules here as they are created, e.g.:
        from app.models import job, user, application  # noqa: F401
    """
    import app.models


_load_models()
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (emits SQL)."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
