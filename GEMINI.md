# NARI - GEMINI.md

This document provides project context and development rules for Gemini CLI in the NARI project.

## Project Overview

**NARI (Not A Random Intelligence)** is a self-hosted, local-first personal productivity platform for one user. It integrates task management, study tracking, notes, goals, habits, reminders, offline access, and behavioral analytics into a private personal operating system.

**Philosophy:** AI-ready but AI-deferred. Every meaningful action is logged through `ActivityLog` so Stage 9 can build on real behavioral history. The product must remain useful without AI.

## Current Status

Stage 9 is complete:

- **AI Co-pilot & Intent Routing**: Powered by cloud-hosted NVIDIA NIM LLaMA 3.1 70B and `tool_registry` allowing intent classification to dynamically create tasks, complete tasks, record behavioral context, or query the system.
- **Local Semantic Memory**: SQLite vector database using SQLModel table `knowledge_nodes` loaded with `sqlite_vec` extension and SentenceTransformers (`all-MiniLM-L6-v2`) locally for high-performance retrieval.
- **Context & Persona Retrieval**: Context builder retrieves top semantic memory nodes (limit=5) and injects them under `CORE DIRECTIVES & RETRIEVED KNOWLEDGE:` along with the active time, pending tasks, active reminders, and recent behavior stream.
- **Natural Conversational Dialogue**: Custom pre-filtering and system prompt rules block function-calling/parameter meta-talk, maintaining a warm and professional copilot dialogue with single tool-call restriction per turn to conform to model provider constraints.
- **Real-Time Background Ingestion (Auto-Digestion)**: Emitting `CONTEXT_LOGGED` events (via `nari tell` or UI context logs) automatically schedules a non-blocking background task. This task uses LLaMA completions on NVIDIA NIM to parse raw context entries, extract structured rules, preferences, and personal identity details, and commit them as vector nodes in the semantic database.
- Stage 8.5/8.7 features (Analytics HUD, PWA caching, IndexedDB offline persistence, background sync, Context Stream archive) remain 100% operational.

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

Examples:

```bash
# Log a raw context entry (triggers background auto-digestion learning)
./nari.sh tell "Ankit prefers to write Rust code at night."

# Manually trigger a digest run for unprocessed context logs
./nari.sh digest
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
