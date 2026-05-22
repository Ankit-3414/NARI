# NARI - GEMINI.md

This document serves as the primary instructional context for Gemini CLI in the NARI project.

## Project Overview
**NARI (Not A Random Intelligence)** is a self-hosted, local-first personal productivity platform. It integrates task management, study tracking, notes, goals, habits, and behavioral analytics into a single "personal operating system" designed for a single user.

- **Philosophy:** AI-ready but AI-deferred. Every action is logged (`ActivityLog`) from day one to build a behavioral dataset for future local AI integration (Ollama/Llama 3.1).
- **Architecture:** API-first with a thin Python CLI and a React web dashboard.

## Tech Stack
- **Backend:** Python 3.12, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite (WAL mode), Alembic (migrations), APScheduler.
- **Frontend:** React (Vite), Tailwind CSS, React Query (TanStack), Lucide icons, Zustand (UI state).
- **CLI:** Python thin-client making REST API calls.
- **Deployment:** Linux (Ubuntu 24.04), Nginx, systemd.

## Engineering Rules (Non-Negotiable)
1.  **Routes vs. Services:** Routes (`backend/app/api/v1/`) must NEVER touch the database. They call Services (`backend/app/services/`).
2.  **Service Communication:** Services must NEVER call other services directly. Use the internal `EventBus` (`backend/app/core/events.py`) for cross-service logic.
3.  **Activity Audit:** Every service method that modifies state MUST write to the `ActivityLog` via `ActivityService`.
4.  **File Size Limit:** Keep files under **250 lines**. Split components or services if they grow larger.
5.  **Service Patterns:** Follow consistent patterns: `create()`, `get()`, `list()`, `update()`, `delete()`.
6.  **CLI Constraints:** The CLI must call the API via HTTP; it never imports from the `app` package.
7.  **Time Management:** All timestamps are stored as **UTC**. Conversion to local time happens only in the UI/CLI.
8.  **Data Integrity:** Never hard-delete subjects or notes (use `archived_at`). Tasks use `status='cancelled'`.
9.  **Migrations:** All schema changes require an Alembic migration.
10. **Response Contract:** All API responses must follow: `{"ok": boolean, "data": object|null, "error": {"code": string, "message": string}|null}`.

## Building and Running

### Backend
- **Location:** `backend/`
- **Setup:** `uv pip install -e .` (or use `.venv` with `pip install -r pyproject.toml`)
- **Run:** `uv run python run.py` (Starts on port 8000)
- **Migrations:** `alembic upgrade head`
- **Tests:** `pytest`

### Frontend
- **Location:** `frontend/`
- **Setup:** `npm install`
- **Run:** `npm run dev` (Starts on port 3000, proxies `/api` to port 8000)
- **Build:** `npm run build`

### CLI
- **Entry Points (Root):** `nari.sh` (Linux), `nari.bat` (Windows), `nari.ps1` (PowerShell).
- **Usage:** `./nari.sh <command> <subcommand>` (e.g., `./nari.sh task list`)

## Project Structure
- `backend/app/api/v1/`: API endpoints.
- `backend/app/services/`: Business logic and ActivityLog emission.
- `backend/app/models/`: SQLModel table definitions.
- `backend/app/schemas/`: Pydantic models for API validation.
- `backend/app/core/`: EventBus, Security, Config, and Constants.
- `frontend/src/components/`: Modular React components (layout, feature-specific, common).
- `frontend/src/hooks/`: React Query hooks for API interaction.
- `cli/`: Standalone Python CLI logic.

## Current Roadmap
The project has completed **Stage 8 (Analytics)** and **Stage 8.5 (PWA & Offline Parity)**.
- **Next Stage:** Stage 9 (AI Layer).

Refer to `docs/CLAUDE.md` for the development checklist and `docs/NARI_Architecture.md` for full technical specifications.
