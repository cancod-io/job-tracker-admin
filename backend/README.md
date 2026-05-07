# Backend — Shopify Job Tracker API

Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2 (async) · PostgreSQL · Alembic · APScheduler.

> **Skeleton only.**. This README focuses on day-to-day commands.

---

## Layout (summary)

```
app/
├── main.py                  # FastAPI factory + lifespan + /health
├── bootstrap.py             # Shared middleware + DB lifespan helpers
├── api/                     # HTTP layer (thin)
│   └── v1/
│       ├── router.py        # Aggregates v1 routers
│       └── routes/          # One module per resource
├── core/                    # Cross-cutting: config, logging, security, exceptions
│   └── config.py            # pydantic-settings — reads .env
├── db/                      # Database plumbing
│   ├── base.py              # SQLAlchemy DeclarativeBase + TimestampMixin
│   └── session.py           # async engine + sessionmaker + get_db dep
├── models/                  # ORM models (DB shape) — TODO
├── schemas/                 # Pydantic DTOs (API shape) — TODO
├── services/                # Business logic — TODO
├── workers/                 # APScheduler glue — TODO (calls out to scraping-service)
└── utils/                   # Stateless helpers
alembic/                     # Migrations (env.py + versions/)
scripts/                     # One-off CLIs
tests/                       # pytest + pytest-asyncio
```
---

## Local development

### 1. Install `uv` (one-time)

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit DATABASE_URL, DATABASE_URL_SYNC, JWT_SECRET, RAPIDAPI_KEY, ...
```

### 4. Start PostgreSQL

Either `docker compose up postgres` from the repo root, or point `DATABASE_URL` at your own instance / a hosted Postgres.

### 5. Run migrations + start the API

```bash
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for Swagger UI.

Sibling deployables at the repo root: `job-api-service/`, `scraping-service/`, and
`user-api-service/` (see each folder’s README). Docker Compose runs this monolith
on port **8000** with the frontend pointed at it.

---

## Common commands

| Command                                      | Purpose                              |
|----------------------------------------------|--------------------------------------|
| `uv sync`                                    | Install / update dependencies        |
| `uv run uvicorn app.main:app --reload`       | Dev server with hot reload           |
| `uv run pytest`                              | Run tests                            |
| `uv run pytest --cov=app`                    | Run tests with coverage              |
| `uv run ruff check .`                        | Lint                                 |
| `uv run ruff format .`                       | Format                               |
| `uv run mypy app`                            | Static type check                    |
| `uv run alembic revision --autogenerate -m "..."` | New migration from ORM diff      |
| `uv run alembic upgrade head`                | Apply all pending migrations         |
| `uv run alembic downgrade -1`                | Roll back the most recent migration  |

---

## Conventions (TL;DR)

- **Routes are thin** — they only validate input/output and call a service.
- **Services own business logic** and are the only layer that opens transactions.
- **ORM models ≠ Pydantic schemas.** Schemas describe the public API; models describe the DB.
- **All public functions are typed.** `mypy --strict` is enforced in CI.
- **Async everywhere.** `httpx.AsyncClient`, async SQLAlchemy, `await`.
- **Never log secrets.** Configure loggers to redact env-like values.