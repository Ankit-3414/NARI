# NARI Technical Architecture

**Version:** v1.0.0-alpha.8  
**Status:** Stage 8.7 complete; Stage 9 in design and implementation
**Last Updated:** 2026-05-29
**Author:** Ankit Upadhyay
**System Type:** Self-hosted personal productivity and intelligence platform  
**Primary Server:** Server-01, Intel i5-2400S, 8GB RAM, 500GB HDD

---

## 1. Project Overview

NARI (Not A Random Intelligence) is a local-first personal operating system for one person. It combines task management, study tracking, notes, reminders, goals, habits, offline access, and analytics into a system that runs on a home server and is accessed through a browser or CLI.

The system is designed to be useful before AI exists. Every meaningful action is logged so the later AI layer can learn from real historical behavior instead of starting from an empty profile.

## 2. Design Principles

1. **Local-first:** User data stays on Server-01.
2. **API-first:** The frontend and CLI use the same REST API.
3. **AI-ready:** ActivityLog, Context Stream, and event boundaries prepare the system for Stage 9.
4. **Time-aware:** Store timestamps in UTC and convert at presentation boundaries.
5. **Auditable:** State changes emit ActivityLog entries.
6. **Daily-use first:** Each stage should end in a usable workflow.

## 3. Hardware Profile

| Spec | Value |
| --- | --- |
| Name | Server-01 |
| CPU | Intel Core i5-2400S, 4 cores, 2.5 GHz |
| RAM | 8 GB DDR3 |
| Storage | 500 GB HDD |
| OS | Ubuntu Server 24.04 LTS |

## 4. Tech Stack

### Backend

- **Framework:** FastAPI, Python 3.12.
- **ORM:** SQLModel on SQLite with WAL mode.
- **Migrations:** Alembic.
- **Scheduler:** APScheduler.
- **Realtime:** WebSockets.

### Frontend

- **Framework:** React with Vite.
- **Styling:** Tailwind CSS.
- **Server state:** TanStack Query.
- **UI state:** Zustand.
- **Icons:** Lucide React.
- **Offline:** PWA service worker and IndexedDB.

### CLI and Infrastructure

- **CLI:** Python thin client that calls the API over HTTP.
- **Deployment:** Nginx, systemd, `uv`, Ubuntu Server 24.04.

## 5. Folder Structure

```text
backend/app/
  main.py              FastAPI entry point
  api/v1/              Routes only; no database logic
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

cli/                   Standalone CLI client
docs/                  Architecture and operating documentation
deploy/                Deployment support files
```

## 6. Environment Variables

Backend configuration is managed through `backend/.env`.

- `NARI_API_KEY`: API authentication secret.
- `DATABASE_URL`: SQLite database path.
- `NARI_TIMEZONE`: Local presentation timezone, for example `Asia/Kolkata`.

## 7. Core Data Model

All major records use shared metadata such as `id`, `created_at`, and `updated_at`.

Core tables:

- `tasks`
- `task_history`
- `reminders`
- `notes`
- `note_versions`
- `subjects`
- `study_sessions`
- `goals`
- `habits`
- `activity_logs`

## 8. API Design

NARI follows RESTful resource routes:

- `GET /api/v1/{resource}`: List resources with optional filters.
- `POST /api/v1/{resource}`: Create a resource.
- `GET /api/v1/{resource}/{id}`: Fetch a resource.
- `PATCH /api/v1/{resource}/{id}`: Partially update a resource.
- `DELETE /api/v1/{resource}/{id}`: Archive, cancel, or otherwise soft-delete.

Routes should validate inputs, call services, and return the standard response contract. Services own database access.

## 9. Response Contract

All API responses should use this shape:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Errors use the same wrapper:

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

## 10. Event and Activity Architecture

### EventBus

Services publish domain events to avoid direct service-to-service coupling. Cross-feature behavior should subscribe to events instead of importing another service and calling it directly.

### ActivityLog

ActivityLog is append-only and records meaningful user and system actions. It is the backbone for the timeline, analytics, Context Stream, and future AI memory.

Activity entries should include:

- `entity_type`
- `entity_id`
- `action`
- `description`
- structured payload or metadata when useful

ActivityLog writes happen after the main state change succeeds. A failed ActivityLog write should be logged, but should not roll back the main operation.

## 11. Neural Intelligence Protocols

### Context Stream

The Context Stream is the low-friction natural-language input layer. Entries are accepted through the API, CLI, and dashboard, then stored chronologically in ActivityLog as context events.

### Pre-Flight Intercept

The frontend checks active reminders frequently and surfaces upcoming reminders before they become missed signals.

### Ghost Protocol

Missed reminders are resolved through defined reminder state transitions so stale signals do not remain indefinitely active.

## 12. WebSocket Event Map

Common event names include:

- `TASK_UPDATED`
- `STUDY_STARTED`
- `STUDY_STOPPED`
- `REMINDER_TRIGGERED`
- `ACTIVITY_LOGGED`

The frontend uses these events to invalidate TanStack Query caches and refresh visible state without a full page reload.

## 13. Build Stages

1. **Stage 0:** Backend core, health endpoint, ActivityLog.
2. **Stage 1:** CLI task management.
3. **Stage 2:** Subjects and study tracking.
4. **Stage 3:** Versioned notes.
5. **Stage 4:** Web dashboard.
6. **Stage 5:** WebSocket real-time sync.
7. **Stage 6:** Scheduler and browser reminders.
8. **Stage 7:** Goals and habits.
9. **Stage 8:** Behavioral analytics.
10. **Stage 8.5:** PWA, offline cache, IndexedDB, background sync.
11. **Stage 9:** Local AI layer.

## 14. Deployment

Production runs on Server-01 behind Nginx:

- Nginx serves the built frontend.
- Nginx proxies `/api` and `/ws` to the FastAPI backend on port 8000.
- systemd keeps the backend running.
- SQLite stores application data locally.

Use `setup.sh` for first-time installation and `update.sh` for production updates.

## 15. Engineering Rules

1. Routes never touch the database directly.
2. Routes call services; services own database operations.
3. Services do not call other services directly; use EventBus for cross-service behavior.
4. Every state-modifying service method writes to ActivityLog.
5. The CLI calls the API and never imports backend internals.
6. Store timestamps in UTC.
7. Convert timezone only in presentation layers.
8. Never hard-delete subjects or notes; use `archived_at`.
9. Tasks should be cancelled or completed through status transitions.
10. Schema changes require Alembic migrations.
11. Keep files under 250 lines unless there is a strong reason.

## 16. Stage 9: Local AI Layer

Stage 9 adds intelligence on top of the existing activity and event system. The direction is a local, resource-aware AI pipeline rather than a cloud dependency.

Planned components:

- **Intent Engine:** A lightweight classifier that reads Context Stream events and routes clear user intent into existing services.
- **Semantic Memory:** Local retrieval over ActivityLog, notes, tasks, study sessions, and selected external knowledge.
- **Nightly Consolidation:** Scheduled jobs that summarize, index, or train from the day's activity while the system is idle.
- **Conversational Interface:** A local assistant layer that uses retrieval and memory to answer questions and suggest actions.

Ollama or other local model runners may be useful for prototyping, but the architecture should keep NARI's core intelligence boundary local, replaceable, and independent of any single model provider.

## 17. Future Roadmap

- Plugin system.
- Calendar integration.
- Voice input and output.
- Richer desktop integrations.
- Multi-device sync orchestration.
- More proactive planning and recommendation workflows.
