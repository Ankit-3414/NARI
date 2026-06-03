# NARI Agent Guide

## Project Context

NARI (Not A Random Intelligence) is a self-hosted personal productivity platform combining tasks, study tracking, notes, goals, habits, reminders, offline access, and analytics. All primary data lives on Server-01, not in third-party clouds.

**Current status:** Stage 9.5 complete (v1.0.0-alpha.10).

**Hardware:** Intel i5-2400S, 8 GB RAM, 500 GB HDD, Ubuntu Server 24.04 LTS.
**Backend:** Python 3.12, FastAPI, SQLModel, SQLite WAL, Alembic, APScheduler.
**Frontend:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React.

## Critical Gotchas

- **Database files are gitignored:** `backend/data/*.db` - clean with `alembic downgrade base` + manual removal
- **Port 3000 conflicts:** Dev server auto-switches to 3001; check what's running
- **Alembic on Windows:** Use `python -m alembic` not `alembic` directly
- **Context logging duplicates:** Fixed in v1.0.0-alpha.8 - event bus handles ActivityLog, no direct calls needed
- **Lucide icons:** Some icons don't exist (e.g., `Export`); use alternatives like `Save`

## CLI Usage

Use the root utility scripts:

- Windows CMD: `nari <command>`
- Windows PowerShell: `.\nari.ps1 <command>`
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

### Database Reset

```powershell
# Clean database and rebuild
python -m alembic downgrade base
Remove-Item backend\data\*.db -Force -ErrorAction SilentlyContinue
uv run alembic upgrade head
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
11. **Stage 8.7 - Context Stream:** Archive page, search, filters, habit/study/mood detection, export.
12. **Stage 9 - AI Layer:** Local intent engine, semantic memory, retrieval, and lightweight model pipeline.

Do not advance stages until the current stage is useful in daily use.

## Engineering Rules

1. Routes never touch the database; routes call services.
2. Services do not call other services directly; use EventBus.
3. Every service method that modifies state writes to ActivityLog **via event emission, not direct calls**.
4. Keep files under 250 lines when practical.
5. Services follow consistent method names such as `create()`, `get()`, `list()`, `update()`, and `delete()`.
6. The CLI calls the API and never imports backend internals.
7. Store all timestamps in UTC.
8. Convert timezone only at presentation boundaries.
9. Never hard-delete subjects or notes; use `archived_at`.
10. Tasks use status transitions such as completed or cancelled.
11. Schema changes require Alembic migrations.
12. Build UI mobile-first and verify desktop behavior.
13. Use `emit_ws_event()` for cross-service communication; it triggers ActivityLog automatically.

## File Structure Rules

```text
backend/app/
  main.py              FastAPI entry point
  api/v1/              Routes only; no DB logic
  core/                Config, security, EventBus, logging
  db/                  SQLModel engine and session handling
  models/              SQLModel table definitions
  schemas/             API validation and response models
  services/            Business logic and ActivityLog emission
  websocket/           WebSocket manager and handlers
  scheduler/           APScheduler setup and jobs
  ai/                  Reserved for Stage 9

frontend/src/
  api/                 API clients
  components/          Layout, common UI, and feature components
  hooks/               Query and mutation hooks
  pages/               Page-level screens
  store/               Zustand stores
```

## ActivityLog Rules

1. Every state-modifying service method must write to ActivityLog.
2. **Use EventBus:** Emit events via `emit_ws_event()` - ActivityLog subscriber handles the write.
3. ActivityLog writes happen after the successful database commit.
4. ActivityLog is append-only.
5. If ActivityLog writing fails, log the error without rolling back the main operation.
6. **Never call `activity_service.create()` directly** if an event is already emitted.

## Deployment

### Initial Setup (Ubuntu Server)

```bash
sudo chmod +x setup.sh
sudo ./setup.sh
```

### Production Updates

```bash
sudo chmod +x update.sh
sudo ./update.sh
```

The update script:
- Pulls latest changes via `git reset --hard origin/main`
- Reapplies permissions (755 dirs, 644 files)
- Updates Nginx config with current IP/hostname
- Runs `uv sync` and `alembic upgrade head`
- Rebuilds frontend
- Restarts systemd services

### Manual Service Control

```bash
sudo systemctl status nari
sudo systemctl restart nari
sudo journalctl -u nari -f
```

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
- [x] Stage 8.7: Context Stream with archive page, search, filters, and enhanced suggestions.
- [ ] Stage 9: Local AI layer provides useful suggestions, intent routing, and private web retrieval via SearXNG.

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

## Version Management

Current version: **v1.0.0-alpha.10**

When version changes, update:
- `frontend/package.json`
- `README.md`
- `docs/VERSIONING.md`
- `docs/NARI_Architecture.md`
- `docs/AGENTS.md` (this file)

Tag major/minor milestones in git.
