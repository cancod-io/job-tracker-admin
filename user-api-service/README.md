# User API service

HTTP API for **auth and users**: register, login, JWT, `/me`, profiles.

Routes are still implemented in **`backend/`** today (`/api/v1/auth/*`). This folder is the **runtime home** once you migrate them; then set **`BFF_AUTH_UPSTREAM`** to this service.

## Current endpoints and role gates

- `POST /api/v1/auth/register` — public
- `POST /api/v1/auth/login` — public
- `GET /api/v1/auth/me` — any authenticated user
- `GET /api/v1/admin/users` — **admin only**
- `PATCH /api/v1/admin/users/{user_id}/role?role=...` — **admin only**
- `GET /api/v1/admin/activity` — **admin or moderator**
- `GET /api/v1/admin/system-config` — **admin only**

## Run locally

```bash
cd user-api-service
uv sync --all-groups
uv run pytest -q
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8011
```
