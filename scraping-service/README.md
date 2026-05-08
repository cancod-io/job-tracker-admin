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

## Reliable HTTP fetching (`app/reliability`)

Use `ReliableFetcher` or `fetch_url()` for outbound HTTP:

- Reads **`robots.txt`** per origin and honors **`Crawl-delay`** for the configured user-agent (cached per origin).
- **Per-domain pacing**: minimum interval between requests to the same host (default 1s), raised by crawl-delay when stricter.
- **Tenacity retries**: up to **`max_retries`** (default **3**) with exponential backoff on **429** and **5xx**, plus transport errors.
- **Structured logs**: `scrape_http_retry` (each failed attempt with `error_code`) and `scrape_http_failed` after exhaustion.

Environment variables: `SCRAPE_HTTP_*` — see `.env.example`.
