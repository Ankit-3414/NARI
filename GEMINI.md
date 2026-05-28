# NARI - GEMINI.md

This document provides project context and development rules for Gemini CLI in the NARI project.

## Project Overview

**NARI (Not A Random Intelligence)** is a self-hosted, local-first personal productivity platform for one user. It integrates task management, study tracking, notes, goals, habits, reminders, offline access, and behavioral analytics into a private personal operating system.

**Philosophy:** AI-ready but AI-deferred. Every meaningful action is logged through `ActivityLog` so Stage 9 can build on real behavioral history. The product must remain useful without AI.

## Current Status

Stage 8.5 is complete:

- Analytics HUD.
- PWA installation.
- Offline static caching.
- IndexedDB persistence for core entities.
- Background sync for offline actions.

The next major stage is Stage 9: a local AI layer with intent routing, semantic memory, retrieval, and a lightweight model pipeline.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLModel, SQLite WAL, Alembic, APScheduler.
- **Frontend:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React.
- **CLI:** Python thin client that calls the REST API.
- **Deployment:** Ubuntu Server 24.04, Nginx, systemd, `uv`.

## Engineering Rules

1. Routes in `backend/app/api/v1/` must not touch the database directly.
2. Routes call services in `backend/app/services/`.
3. Services must not call other services directly; use the EventBus in `backend/app/core/events.py`.
4. Every service method that modifies state must write to ActivityLog.
5. Keep files under 250 lines when practical.
6. Follow consistent service patterns such as `create()`, `get()`, `list()`, `update()`, and `delete()`.
7. The CLI calls the API over HTTP and never imports from `backend/app`.
8. Store timestamps in UTC.
9. Convert timezones only in presentation layers.
10. Never hard-delete subjects or notes; use `archived_at`.
11. Tasks should use status transitions such as completed or cancelled.
12. Schema changes require Alembic migrations.
13. API responses must use the standard response contract.

## Building and Running

### Backend

Run from `backend/`:

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv sync
Copy-Item .env.example .env
uv run alembic upgrade head
uv run python run.py
uv run pytest
```

### Frontend

Run from `frontend/`:

```bash
npm install
npm run dev
npm run build
npm run lint
```

### CLI

Root entry points:

- Linux: `./nari.sh`
- Windows CMD: `nari.bat`
- Windows PowerShell: `nari.ps1`

Example:

```bash
./nari.sh tell "Finished a focused work block"
```

## Project Structure

- `backend/app/api/v1/`: API endpoints.
- `backend/app/services/`: Business logic and ActivityLog emission.
- `backend/app/models/`: SQLModel table definitions.
- `backend/app/schemas/`: Pydantic API models.
- `backend/app/core/`: EventBus, security, config, logging.
- `frontend/src/components/`: Layout, common UI, and feature components.
- `frontend/src/hooks/`: TanStack Query hooks for API interaction.
- `cli/`: Standalone Python CLI logic.
- `docs/`: Architecture, operating, and feature documentation.

## Response Contract

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with id 42 does not exist"
  }
}
```

For full technical context, see `docs/NARI_Architecture.md`.
