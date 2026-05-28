# NARI Backend

FastAPI backend for NARI. It owns the REST API, business services, SQLite persistence, WebSocket events, scheduler jobs, and ActivityLog emission.

## Tech Stack

- Python 3.12.
- FastAPI.
- SQLModel on SQLite with WAL mode.
- Alembic migrations.
- APScheduler.
- WebSockets.
- `uv` for dependency management.

## Setup

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv sync
Copy-Item .env.example .env
```

Update `NARI_API_KEY` in `.env` before running the server.

## Database

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run alembic upgrade head
```

Alembic owns schema changes. Runtime startup should only prepare SQLite directories, apply WAL pragmas, and check connectivity.

## Run

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run python run.py
```

Health check:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/v1/health `
  -Headers @{ Authorization = 'Bearer changeme-your-api-key-here' }
```

## Test

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run pytest
```

## Architecture Rules

- Routes validate requests and call services.
- Services own database access.
- Services communicate across domains through EventBus.
- Every state-modifying service method writes to ActivityLog.
- Timestamps are stored in UTC.
- Schema changes require Alembic migrations.
