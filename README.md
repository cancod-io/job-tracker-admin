# Shopify Remote Job Tracker

> Internal command center for our team to find, filter, and apply to long-term remote **Shopify developer** jobs faster than the competition.

This is **not** another public job board. It exists to:

- Aggregate Shopify-relevant remote roles from many sources (Google Jobs / JSearch, RemoteOK, We Work Remotely, etc.)
- Filter aggressively for **Shopify, Shopify Plus, Liquid, Hydrogen, React, headless commerce, theme dev**.
- Drop one-off gigs and short freelance tasks — long-term roles only.
- Track **who on the team applied, when, status, follow-up date, notes, interview stage**.
- Surface freshness signals: *"posted within 1 hour"*, *"new company"*, *"not applied yet"*, *"high match"*.

---

## Status

> **MVP — Ticket #1 / Setup repo & base structure.**
>
> This commit ships the **runnable skeleton only**. No business logic, no scrapers, no auth. The folder layout, configs, Docker setup, migrations, and CI are all in place so the team can start filling in features without arguing about structure.
>
> See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the layout, conventions, and where new code should go.

---

## Tech stack

| Layer       | Tech                                                         |
|-------------|--------------------------------------------------------------|
| Frontend    | Next.js 15 (App Router) · TypeScript (strict) · Tailwind · shadcn/ui |
| Backend     | Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2 (async) · Alembic · APScheduler |
| Database    | PostgreSQL 16 (asyncpg)                                      |
| Scraping    | httpx · BeautifulSoup4 · JSearch (RapidAPI) for Google Jobs  |
| Auth        | JWT (HS256) — email/password stored in PostgreSQL            |
| Tooling     | uv · ruff · mypy · pytest · ESLint · Prettier                |
| CI          | GitHub Actions                                               |

---

## Repository layout (top-level)

```
shopify-job-tracker/
├── backend/        # FastAPI + scrapers (Python 3.12, uv-managed)
├── frontend/       # Next.js 15 App Router (TypeScript, Tailwind, shadcn/ui)
├── .github/workflows/
├── docker-compose.yml
├── ARCHITECTURE.md ← read this first
└── README.md
```

The full directory tree, per-folder responsibilities, and conventions are in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Quickstart

### With Docker (recommended)

```bash
git clone <repo-url> shopify-job-tracker
cd shopify-job-tracker
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
docker compose up --build
```

| Service  | URL                                                           |
|----------|---------------------------------------------------------------|
| Frontend | http://localhost:3000                                         |
| Backend  | http://localhost:8000/docs (Swagger UI)                       |
| Postgres | `postgresql://sjt:sjt@localhost:5432/shopify_job_tracker`     |

### Without Docker

```bash
# Backend
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend (in a second terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## What works today

- `GET /health` — backend liveness probe.
- Frontend landing page that links to the backend health check.
- `pytest`, `ruff`, `mypy` all clean on `backend/`.
- `npm run lint`, `tsc --noEmit`, and `next build` all clean on `frontend/`.
- `alembic upgrade head` runs (no migrations yet — empty schema).
- GitHub Actions CI runs both stacks on PR / push to `main`.

Everything else is **scaffolded but empty**, ready for follow-up tickets — see the roadmap in `ARCHITECTURE.md` §8.
