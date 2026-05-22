# NARI v3 - Development Guide

## Project Context

NARI (Not A Random Intelligence) is a self-hosted personal productivity platform combining task management, study tracking, notes, goals, habits, reminders, and analytics. All data lives on Server-01, never in third-party clouds.

**Hardware:** Intel i5-2400S, 8GB RAM, 500GB HDD, Ubuntu Server 24.04 LTS
**Tech Stack:** Python 3.12 + FastAPI + SQLModel + SQLite (backend), React + Vite + Tailwind (frontend)

## CLI Usage

The NARI CLI can be invoked using the utility scripts at the project root:
- **Windows (CMD):** `nari <command>`
- **Windows (PowerShell):** `.\nari <command>`
- **Linux:** `./nari.sh <command>`

These scripts automatically use the project's virtual environment or `uv`.

## Developer Commands

### Backend
- **Setup:**
  ```powershell
  $env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
  uv sync
  Copy-Item .env.example .env
  # Edit .env to set NARI_API_KEY
  ```
- **Database Migrations:**
  ```powershell
  $env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
  uv run alembic upgrade head
  ```
- **Run Server:**
  ```powershell
  $env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
  uv run python run.py
  ```
- **Health Check:**
  ```powershell
  Invoke-RestMethod `
    -Uri http://192.168.1.100:8000/api/v1/health `
    -Headers @{ Authorization = 'Bearer <your-api-key>' }
  ```
- **Run Tests:**
  ```powershell
  $env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
  uv run pytest
  ```

### Frontend (from `frontend` directory)
- **Install Dependencies:** `npm install` (if needed)
- **Development Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Lint:** `npm run lint`
- **Preview:** `npm run preview`

## Build Stages (Follow Sequentially)

1. **Stage 0 - Skeleton** (3-5 days): Backend foundation, health endpoint, ActivityLog
2. **Stage 1 - Tasks** (7-10 days): CLI task management - stop using other tools
3. **Stage 2 - Subjects + Study** (7-10 days): Study session tracking with interruptions
4. **Stage 3 - Notes** (7-10 days): Versioned notes with full-text search
5. **Stage 4 - Web Dashboard** (2 weeks): Mobile-first React interface
6. **Stage 5 - WebSockets** (5-7 days): Live updates without refresh
7. **Stage 6 - Reminders** (5-7 days): Browser notifications and scheduler
8. **Stage 7 - Goals + Habits** (1-2 weeks): Long-term vision tracking
9. **Stage 8 - Analytics** (5-7 days): Behavioral pattern recognition
10. **Stage 9 - AI Layer** (1 week): Ollama Llama 3.1 8B for local insights

**Rule:** Never start a new stage until the current stage is in daily use.

## Engineering Rules (Non-Negotiable)

1. **Routes never touch the database** - Routes call services, services touch DB
2. **Services never call other services directly** - Use event bus for cross-service communication
3. **Every service method that modifies state writes to ActivityLog** - No exceptions
4. **Files stay under 250 lines** - Split if larger
5. **All services follow the same pattern** - create(), get(), list(), update(), delete()
6. **The CLI calls the API** - Never imports from backend app directly
7. **All timestamps are stored as UTC** - Timezone conversion at presentation layer
8. **Never hard-delete subjects or notes** - Use archived_at. Tasks use status=cancelled
9. **Schema changes require an Alembic migration** - Never modify DB directly in production
10. **Build for mobile-first** - Every UI decision tested on phone screen first

## File Structure Rules

```
backend/app/
├── main.py              # FastAPI entry point
├── api/v1/              # Routes ONLY - no DB logic
├── core/                # config.py, security.py, events.py, logging.py
├── db/session.py        # SQLModel engine with WAL mode
├── models/              # SQLModel Table classes (DB layer)
├── schemas/             # Pydantic BaseModel classes (API layer)
├── services/            # Business logic - all follow same pattern
├── websocket/           # manager.py, handlers.py, events.py
├── scheduler/           # APScheduler setup and jobs
└── ai/                  # EMPTY - reserved for Stage 9
```

## ActivityLog Rules

1. Every service method that modifies state MUST write to ActivityLog
2. ActivityLog writes happen AFTER successful DB commit
3. ActivityLog is append-only - never update or delete
4. If ActivityLog write fails, log error but don't roll back main operation
5. Use background task if writes become slow

## Development Checklist

- [ ] Stage 0: Health endpoint returns `{"ok": true}` with valid API key
- [ ] Stage 1: Stopped using other task managers, CLI works
- [ ] Stage 2: Every study session tracked through NARI
- [ ] Stage 3: All notes centralized with version history
- [ ] Stage 4: Open NARI on phone every morning
- [ ] Stage 5: Changes appear live without page refresh
- [x] Stage 6: Reminders trigger browser notifications
- [ ] Stage 7: Goals and habits in daily use
- [x] Stage 8: Analytics HUD implemented
- [ ] Stage 9: AI provides useful suggestions

## Response Contract (Always Use)

```json
// Success
{"ok": true, "data": {}, "error": null}

// Error
{"ok": false, "data": null, "error": {"code": "TASK_NOT_FOUND", "message": "Task with id 42 does not exist"}}
```

## Current Status

Stage 8 complete. Behavioral Analytics HUD implemented. Moving to Stage 9 - AI Layer (Ollama + Llama 3.1 8B Integration).
