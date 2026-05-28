# NARI Agent Guide

## Project Context

NARI (Not A Random Intelligence) is a self-hosted personal productivity platform combining tasks, study tracking, notes, goals, habits, reminders, offline access, and analytics. All primary data lives on Server-01, not in third-party clouds.

**Current status:** Stage 8.5 complete. Stage 9, the local AI layer, is next.

**Hardware:** Intel i5-2400S, 8 GB RAM, 500 GB HDD, Ubuntu Server 24.04 LTS.
**Backend:** Python 3.12, FastAPI, SQLModel, SQLite WAL, Alembic, APScheduler.
**Frontend:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React.

## CLI Usage

Use the root utility scripts:

- Windows CMD: `nari <command>`
- Windows PowerShell: `.\nari <command>`
- Linux: `./nari.sh <command>`

Examples:

```bash
./nari.sh tell "Finished a focused study session"
./nari.sh add "Revise physics" --priority high
./nari.sh today
./nari.sh activity --limit 10
```

## Developer Commands

### Backend

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
npm run preview
```

## Build Stages

1. **Stage 0 - Skeleton:** Backend foundation, health endpoint, ActivityLog.
2. **Stage 1 - Tasks:** CLI task management.
3. **Stage 2 - Subjects and Study:** Study session tracking with interruptions.
4. **Stage 3 - Notes:** Versioned notes.
5. **Stage 4 - Web Dashboard:** Responsive React dashboard.
6. **Stage 5 - WebSockets:** Live updates without refresh.
7. **Stage 6 - Reminders:** Browser notifications and scheduler.
8. **Stage 7 - Goals and Habits:** Long-term vision tracking.
9. **Stage 8 - Analytics:** Behavioral pattern recognition.
10. **Stage 8.5 - PWA and Offline:** Installable app, local cache, IndexedDB, background sync.
11. **Stage 9 - AI Layer:** Local intent engine, semantic memory, retrieval, and lightweight model pipeline.

Do not advance stages until the current stage is useful in daily use.

## Engineering Rules

1. Routes never touch the database; routes call services.
2. Services do not call other services directly; use EventBus.
3. Every service method that modifies state writes to ActivityLog.
4. Keep files under 250 lines when practical.
5. Services follow consistent method names such as `create()`, `get()`, `list()`, `update()`, and `delete()`.
6. The CLI calls the API and never imports backend internals.
7. Store all timestamps in UTC.
8. Convert timezone only at presentation boundaries.
9. Never hard-delete subjects or notes; use `archived_at`.
10. Tasks use status transitions such as completed or cancelled.
11. Schema changes require Alembic migrations.
12. Build UI mobile-first and verify desktop behavior.

## File Structure Rules

```text
backend/app/
  main.py              FastAPI entry point
  api/v1/              Routes only; no DB logic
  core/                Config, security, EventBus, logging
  db/session.py        SQLModel engine with WAL mode
  models/              SQLModel table classes
  schemas/             Pydantic API models
  services/            Business logic and ActivityLog emission
  websocket/           WebSocket manager and handlers
  scheduler/           APScheduler setup and jobs
  ai/                  Reserved for Stage 9
```

## ActivityLog Rules

1. Every state-modifying service method must write to ActivityLog.
2. ActivityLog writes happen after the successful database commit.
3. ActivityLog is append-only.
4. If ActivityLog writing fails, log the error without rolling back the main operation.
5. Use background work if ActivityLog writes become slow.

## Development Checklist

- [x] Stage 0: Health endpoint and ActivityLog.
- [x] Stage 1: CLI task management.
- [x] Stage 2: Subjects and study sessions.
- [x] Stage 3: Versioned notes.
- [x] Stage 4: Responsive web dashboard.
- [x] Stage 5: WebSocket live updates.
- [x] Stage 6: Scheduler and browser reminders.
- [x] Stage 7: Goals and habits.
- [x] Stage 8: Analytics HUD.
- [x] Stage 8.5: PWA, offline cache, IndexedDB, and background sync.
- [ ] Stage 9: Local AI layer provides useful suggestions and intent routing.

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
