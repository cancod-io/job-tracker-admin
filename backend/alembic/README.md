# Alembic — database migrations

## Common commands

```bash
# Create a new revision from current ORM models
uv run alembic revision --autogenerate -m "create jobs table"

# Apply all pending migrations
uv run alembic upgrade head

# Roll back the most recent migration
uv run alembic downgrade -1

# Show current revision
uv run alembic current

# Show migration history
uv run alembic history --verbose
```

## When you add a new model

1. Create the file under `app/models/`.
2. Import it inside `_load_models()` in `alembic/env.py` so autogenerate sees it.
3. Run `alembic revision --autogenerate -m "..."` and review the generated file.
4. Apply with `alembic upgrade head`.

## Notes

- The DB URL comes from `DATABASE_URL_SYNC` (the **sync** driver, e.g. `postgresql://...`).
  The application itself uses `DATABASE_URL` (`postgresql+asyncpg://...`).
- Generated revisions are auto-formatted by `ruff` via the `post_write_hooks` in `alembic.ini`.
- `compare_type=True` and `compare_server_default=True` are enabled for accurate diffs.
