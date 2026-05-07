# Job API service

HTTP API for **job discovery and listing** (JSearch / remote boards, normalization hooks, ingestion triggers).

Today this is a **thin FastAPI scaffold** (`/health`). Move job-related routers from `backend/` here when ready, then set `bff` **`BFF_JOB_UPSTREAM`** to this service’s URL.

## Run locally

```bash
cd job-api-service
uv sync --all-groups
uv run pytest -q
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8010
```
