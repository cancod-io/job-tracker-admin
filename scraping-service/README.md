# Scraping service

Owns **`app/scrapers/`** — HTML/API collectors, enrichment, retries, rate limits.

Historically scrapers lived under `backend/app/scrapers/`; that package now lives **only here**.

## Current admin endpoints and role gates

- `GET /api/v1/admin/scrapers/logs` — **admin or moderator**
- `POST /api/v1/admin/scrapers/run` — **admin or moderator**
- `POST /api/v1/admin/scrapers/config` — **admin only**

## Run locally

```bash
cd scraping-service
uv sync --all-groups
uv run pytest -q
```

Add scraper modules as `app/scrapers/<source>.py` and call them from a worker entrypoint you add later (or from `backend` workers via HTTP/subprocess once wired).
