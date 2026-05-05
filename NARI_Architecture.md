# NARI Technical Architecture Document

**Version:** v1.0.0-alpha.4  
**Status:** In Development (Stage 5)  
**Last Updated:** 2026-05-05  
**Author:** Ankit (Solo Developer)  
**System Type:** Self-hosted personal productivity and intelligence platform  
**Primary Server:** Server-01 (Intel i5-2400S, 8GB RAM, 500GB HDD)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Hardware Constraints](#2-hardware-constraints)
3. [Design Principles](#3-design-principles)
4. [Finalized Tech Stack](#4-finalized-tech-stack)
5. [Folder Structure](#5-folder-structure)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Response Contract](#9-response-contract)
10. [WebSocket Event Map](#10-websocket-event-map)
11. [ActivityLog Specification](#11-activitylog-specification)
12. [Build Order & Milestones](#12-build-order--milestones)
13. [Deployment Setup — Server-01](#13-deployment-setup--server-01)
14. [Engineering Rules](#14-engineering-rules)
15. [AI Layer — Reserved (Stage 9)](#15-ai-layer--reserved-stage-9)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Project Overview

NARI (Not A Random Intelligence) is a local-first, self-hosted personal operating system for one person. It combines task management, study tracking, notes, goals, habits, reminders, and analytics into a single system that runs permanently on Server-01 and is accessible from any device on the home network via browser.

**Core philosophy:**
- NARI should learn the user's patterns and grow with them over time
- Every action is logged from day one — behavioral data accumulates before AI arrives
- The system is usable without AI forever; AI only enhances, never controls
- Each build stage must end with something in daily use

**What NARI actually is:**
A self-hosted, private alternative to Notion + Todoist + Obsidian + a study tracker, with a behavioral data layer that feeds a future AI intelligence system.

---

## 2. Hardware Profile — Server-01

| Spec | Value |
|---|---|
| Name | **Server-01** |
| CPU | Intel Core i5-2400S (4 cores, 2.5GHz, Sandy Bridge) |
| RAM | 8GB DDR3 |
| Storage | 500GB HDD |
| Network | Home LAN (Ethernet) |
| OS | Ubuntu Server 24.04 LTS |
| AI Capability | Ollama + Llama 3.1 8B (reserved for Stage 9) |

**Previous hardware:** Raspberry Pi 3B v1.2 — retired from NARI. All Pi-specific constraints are removed.

**Memory budget at runtime:**

| Component | RAM Usage |
|---|---|
| Ubuntu Server 24.04 idle | ~210MB |
| NARI backend (Uvicorn) | ~100MB |
| Nginx | ~10MB |
| SQLite | ~20MB |
| **Total (Stages 0–8)** | **~340MB** |
| Ollama + Llama 3.1 8B (Stage 9) | ~5.5GB |
| **Total with AI** | **~6GB** |

**Headroom:** ~1.6GB free even with AI running. Zero memory pressure at any stage.

---

## 3. Design Principles

1. **Local-first** — all data lives on Server-01, never in a third-party cloud
2. **API-first** — CLI and web UI both call the same REST API, no shortcuts
3. **AI-deferred, AI-ready** — no AI built now, but every service is designed for easy AI integration later
4. **Time-aware** — every model stores full history with timestamps, not just current state
5. **ActivityLog always** — every meaningful action is silently logged, no exceptions
6. **Momentum over perfection** — each stage ships something in daily use
7. **Last-write-wins** — sync strategy is simple; complex merging deferred
8. **Files under 250 lines** — optimizes for AI-assisted development
9. **Consistent service pattern** — all services look identical in structure
10. **Single user** — no multi-user complexity until Year 4+

---

## 4. Finalized Tech Stack

### Backend (runs on Server-01)

| Component | Choice | Reason |
|---|---|---|
| Language | Python 3.12 | Familiarity, ecosystem, native on Ubuntu 24.04 |
| API Framework | FastAPI | Async, auto-docs, Pydantic native |
| ASGI Server | Uvicorn (2 workers) | Server-01 has headroom for multiple workers |
| ORM | SQLModel | Pydantic + SQLAlchemy unified |
| Database | SQLite (WAL mode) | Zero-dependency, sufficient for single user |
| Migrations | Alembic | Production-grade schema versioning |
| Scheduler | APScheduler (in-process) | No Redis dependency |
| HTTP Client | httpx | Async, used for future AI API calls |
| Config | python-dotenv | Simple env-based config |
| Auth | Single static API key | Single-user, no session complexity |

### Frontend (served from Server-01 via Nginx)

| Component | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Fast builds, excellent DX |
| Styling | Tailwind CSS | Utility-first, mobile-first |
| State (UI) | Zustand | Lightweight vs Redux |
| State (server) | React Query | Caching, refetch, loading states |
| Real-time | Native WebSocket client | No extra library |
| Charts | Recharts | Lightweight, composable |
| Markdown | react-markdown | Note rendering |

---

## 5. Folder Structure

```
nari/
├── nari.bat                    # Windows CMD entry point for CLI
├── nari.ps1                    # PowerShell entry point for CLI
├── nari.sh                     # Linux entry point for CLI
├── setup.sh                    # Linux initialization script
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry, lifespan, middleware
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py          # Mounts all route modules
│   │   │       ├── health.py          # GET /health, GET /version
│   │   │       ├── auth.py            # POST /auth/verify only
│   │   │       ├── tasks.py
│   │   │       ├── subjects.py
│   │   │       ├── study.py
│   │   │       ├── notes.py
│   │   │       ├── reminders.py
│   │   │       ├── goals.py
│   │   │       ├── habits.py
│   │   │       ├── analytics.py
│   │   │       └── activity.py
│   │   ├── core/
│   │   │   ├── config.py              # Settings from .env
│   │   │   ├── security.py            # API key verification middleware
│   │   │   ├── logging.py             # Structured logger setup
│   │   │   ├── events.py              # In-process event bus
│   │   │   └── constants.py           # Enums: status, priority, scope
│   │   ├── db/
│   │   │   ├── session.py             # SQLModel engine + get_session dependency
│   │   │   ├── base.py                # SQLModel base with id, created_at, updated_at
│   │   │   └── migrations/            # Alembic managed — do not edit manually
│   │   ├── models/                    # SQLModel table definitions (DB layer)
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   ├── task_history.py
│   │   │   ├── subject.py
│   │   │   ├── study_session.py
│   │   │   ├── note.py
│   │   │   ├── note_version.py
│   │   │   ├── reminder.py
│   │   │   ├── goal.py
│   │   │   ├── habit.py
│   │   │   ├── habit_log.py
│   │   │   ├── activity_log.py
│   │   │   └── device.py              # Reserved for future device management
│   │   ├── schemas/                   # Pydantic schemas (API layer)
│   │   │   ├── common.py              # BaseResponse, ErrorDetail
│   │   │   ├── task.py
│   │   │   ├── subject.py
│   │   │   ├── study.py
│   │   │   ├── note.py
│   │   │   ├── reminder.py
│   │   │   ├── goal.py
│   │   │   ├── habit.py
│   │   │   └── analytics.py
│   │   ├── services/                  # Business logic — all services follow same pattern
│   │   │   ├── task_service.py
│   │   │   ├── subject_service.py
│   │   │   ├── study_service.py
│   │   │   ├── note_service.py
│   │   │   ├── reminder_service.py
│   │   │   ├── goal_service.py
│   │   │   ├── habit_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── activity_service.py    # ActivityLog writer — used by all services
│   │   ├── websocket/
│   │   │   ├── manager.py             # Connection registry, broadcast logic
│   │   │   ├── handlers.py            # Route handler for /ws
│   │   │   └── events.py              # Event name constants + payload builders
│   │   ├── scheduler/
│   │   │   ├── scheduler.py           # APScheduler instance setup
│   │   │   └── jobs.py                # Reminder trigger jobs, daily summary jobs
│   │   ├── ai/
│   │   │   └── __init__.py            # Reserved — empty placeholder for Stage 9
│   │   └── utils/
│   │       ├── datetime_utils.py      # Timezone-aware helpers
│   │       ├── id_utils.py            # Deterministic ID generation
│   │       ├── validation_utils.py    # Input sanitizers
│   │       └── text_utils.py          # Markdown helpers, truncation
│   ├── tests/
│   │   ├── test_tasks.py
│   │   ├── test_study.py
│   │   ├── test_notes.py
│   │   ├── test_auth.py
│   │   └── test_activity.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── .env.example
│   └── run.py                         # Entry point: uvicorn app.main:app
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   ├── router.jsx             # React Router v6 routes
│   │   │   └── providers.jsx          # QueryClient, auth context
│   │   ├── api/
│   │   │   ├── client.js              # Axios/fetch base with auth header
│   │   │   ├── tasks.js
│   │   │   ├── subjects.js
│   │   │   ├── study.js
│   │   │   ├── notes.js
│   │   │   ├── reminders.js
│   │   │   ├── goals.js
│   │   │   ├── habits.js
│   │   │   ├── analytics.js
│   │   │   └── websocket.js           # WS connection manager with reconnect
│   │   ├── store/
│   │   │   ├── authStore.js           # API key, auth state
│   │   │   ├── uiStore.js             # Sidebar, modal, theme state
│   │   │   └── sessionStore.js        # Active study session state
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── MobileNav.jsx
│   │   │   │   └── PageWrapper.jsx
│   │   │   ├── tasks/
│   │   │   │   ├── TaskCard.jsx
│   │   │   │   ├── TaskList.jsx
│   │   │   │   ├── TaskForm.jsx
│   │   │   │   └── TaskFilters.jsx
│   │   │   ├── study/
│   │   │   │   ├── StudyTimer.jsx
│   │   │   │   ├── SessionCard.jsx
│   │   │   │   └── SubjectPicker.jsx
│   │   │   ├── notes/
│   │   │   │   ├── NoteCard.jsx
│   │   │   │   ├── NoteEditor.jsx
│   │   │   │   └── NoteSearch.jsx
│   │   │   ├── analytics/
│   │   │   │   ├── StudyChart.jsx
│   │   │   │   ├── TaskTrend.jsx
│   │   │   │   └── HabitGrid.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── Spinner.jsx
│   │   │       └── ConnectionStatus.jsx
│   │   ├── pages/
│   │   │   ├── TodayPage.jsx          # Dashboard home — tasks + active session
│   │   │   ├── TasksPage.jsx
│   │   │   ├── StudyPage.jsx
│   │   │   ├── SubjectsPage.jsx
│   │   │   ├── NotesPage.jsx
│   │   │   ├── RemindersPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── HabitsPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── ActivityPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   ├── useStudySession.js
│   │   │   └── useAuth.js
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── cli/
│   └── nari.py                        # Standalone CLI — thin HTTP client, no business logic
│
├── data/
│   ├── nari.db                        # SQLite database (WAL mode)
│   ├── backups/                       # Daily automated backups
│   └── exports/                       # JSON export files
│
├── deploy/
│   ├── nari-backend.service           # systemd service file
│   ├── nginx.conf                     # Nginx reverse proxy config
│   ├── backup.sh                      # Daily backup script
│   └── restore.sh                     # Restore from backup
│
└── README.md
```

**Key structural rules:**
- `models/` = database tables only (SQLModel Table classes)
- `schemas/` = API shapes only (Pydantic BaseModel classes)
- `services/` = all business logic; routes never query DB directly
- `cli/nari.py` is at root, NOT inside the backend app
- `ai/` exists as an empty placeholder — do not delete it

---

## 6. Environment Variables

**File:** `backend/.env.example`

```env
# ── Core ──────────────────────────────────────────
NARI_ENV=development                    # development | production
NARI_SECRET_KEY=changeme-use-long-random-string

# ── Auth ──────────────────────────────────────────
NARI_API_KEY=changeme-your-api-key-here

# ── Database ──────────────────────────────────────
DATABASE_URL=sqlite:///./data/nari.db

# ── Server ────────────────────────────────────────
NARI_HOST=0.0.0.0
NARI_PORT=8000
NARI_WORKERS=1                          # Always 1 on Pi 3B

# ── Logging ───────────────────────────────────────
NARI_LOG_LEVEL=INFO                     # DEBUG | INFO | WARNING | ERROR

# ── User Preferences ──────────────────────────────
NARI_TIMEZONE=Asia/Kolkata
NARI_THEME=dark

# ── Scheduler ─────────────────────────────────────
NARI_SCHEDULER_ENABLED=true

# ── AI (Reserved — leave blank until Stage 9) ─────
GROQ_API_KEY=
ANTHROPIC_API_KEY=
AI_PROVIDER=                            # groq | anthropic
AI_ENABLED=false
```

---

## 7. Database Schema

All tables use SQLite with WAL mode. All timestamps are stored as UTC ISO 8601. Timezone conversion happens at the service layer using the user's configured timezone.

### Base fields (inherited by all models)

```
id          INTEGER  PRIMARY KEY AUTOINCREMENT
created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
```

---

### users

Single-user now, schema is multi-user ready.

```sql
id              INTEGER  PK
username        TEXT     NOT NULL UNIQUE
display_name    TEXT
api_key_hash    TEXT     NOT NULL
timezone        TEXT     NOT NULL DEFAULT 'Asia/Kolkata'
theme           TEXT     DEFAULT 'dark'
created_at      DATETIME
updated_at      DATETIME
last_seen_at    DATETIME
preferences_json TEXT    -- only for truly misc prefs; never query this field
```

---

### subjects

```sql
id              INTEGER  PK
name            TEXT     NOT NULL UNIQUE
description     TEXT
difficulty      INTEGER  -- 1-5 scale
priority        INTEGER  DEFAULT 0
exam_date       DATE
tags_json       TEXT     -- JSON array of strings
created_at      DATETIME
updated_at      DATETIME
archived_at     DATETIME -- NULL = active
```

---

### tasks

```sql
id                  INTEGER  PK
title               TEXT     NOT NULL
description         TEXT
priority            TEXT     NOT NULL DEFAULT 'normal'  -- low|normal|high|urgent
status              TEXT     NOT NULL DEFAULT 'pending' -- pending|in_progress|done|cancelled
due_date            DATE
subject_id          INTEGER  FK → subjects(id) NULLABLE
tags_json           TEXT     -- JSON array
estimated_minutes   INTEGER
actual_minutes      INTEGER
recurrence_rule     TEXT     -- RRULE format (RFC 5545)
parent_task_id      INTEGER  FK → tasks(id) NULLABLE -- subtask support
sort_index          INTEGER
created_at          DATETIME
updated_at          DATETIME
completed_at        DATETIME -- NULL until completed
```

### task_history

Full audit trail. Written on every task change.

```sql
id              INTEGER  PK
task_id         INTEGER  FK → tasks(id) NOT NULL
action          TEXT     NOT NULL  -- created|updated|completed|reopened|deleted
old_data_json   TEXT     -- snapshot before change
new_data_json   TEXT     -- snapshot after change
changed_at      DATETIME NOT NULL
changed_by      TEXT     DEFAULT 'user'
```

---

### notes

```sql
id                  INTEGER  PK
title               TEXT     NOT NULL
content_markdown    TEXT     NOT NULL DEFAULT ''
summary             TEXT     -- AI-generated when Stage 9 arrives
subject_id          INTEGER  FK → subjects(id) NULLABLE
tags_json           TEXT
created_at          DATETIME
updated_at          DATETIME
archived_at         DATETIME
```

### note_versions

Snapshot on every save. Enables full version history.

```sql
id                  INTEGER  PK
note_id             INTEGER  FK → notes(id) NOT NULL
version_number      INTEGER  NOT NULL
content_markdown    TEXT     NOT NULL
created_at          DATETIME NOT NULL
change_note         TEXT     -- optional user label
```

---

### study_sessions

```sql
id                  INTEGER  PK
subject_id          INTEGER  FK → subjects(id) NOT NULL
status              TEXT     NOT NULL DEFAULT 'running'  -- running|paused|completed
goal_text     TEXT     -- what the user plans to achieve
notes               TEXT     -- post-session notes
started_at          DATETIME NOT NULL
paused_at          DATETIME -- last pause timestamp
resumed_at          DATETIME -- last resume timestamp
ended_at            DATETIME -- NULL until stopped
duration_seconds    INTEGER  NOT NULL DEFAULT 0  -- calculated on stop
interrupt_count     INTEGER  NOT NULL DEFAULT 0  -- incremented on each pause
interruptions_json  TEXT     -- JSON array of pause timestamps
created_at          DATETIME
```

**Note:** `interrupt_count` and `interruptions_json` are included from day one. Historical interruption data cannot be reconstructed if these fields are added later.

---

### reminders

```sql
id              INTEGER  PK
title           TEXT     NOT NULL
message         TEXT
due_at          DATETIME NOT NULL
repeat_rule     TEXT     -- RRULE format, NULL = one-time
status          TEXT     NOT NULL DEFAULT 'scheduled'  -- scheduled|triggered|snoozed|dismissed
task_id         INTEGER  FK → tasks(id) NULLABLE
subject_id      INTEGER  FK → subjects(id) NULLABLE
triggered_at    DATETIME
snoozed_until   DATETIME
created_at      DATETIME
updated_at      DATETIME
```

---

### goals

```sql
id              INTEGER  PK
title           TEXT     NOT NULL
description     TEXT
scope           TEXT     NOT NULL DEFAULT 'weekly'  -- daily|weekly|monthly|quarterly|yearly
status          TEXT     NOT NULL DEFAULT 'active'   -- active|completed|abandoned
target_value    INTEGER  -- e.g. 10 tasks, 20 study hours
current_value   INTEGER  NOT NULL DEFAULT 0
start_date      DATE
due_date        DATE
parent_goal_id  INTEGER  FK → goals(id) NULLABLE -- hierarchy
created_at      DATETIME
updated_at      DATETIME
```

---

### habits

```sql
id                  INTEGER  PK
name                TEXT     NOT NULL
description         TEXT
frequency           TEXT     NOT NULL DEFAULT 'daily'  -- daily|weekly
target_count        INTEGER  NOT NULL DEFAULT 1
current_streak      INTEGER  NOT NULL DEFAULT 0
best_streak         INTEGER  NOT NULL DEFAULT 0
last_completed_at   DATETIME
created_at          DATETIME
updated_at          DATETIME
```

### habit_logs

```sql
id              INTEGER  PK
habit_id        INTEGER  FK → habits(id) NOT NULL
completed_at    DATETIME NOT NULL
note            TEXT
```

---

### activity_logs

**The most important table in the system.** This is what enables NARI to learn over time. Never skip writing to this table.

```sql
id              INTEGER  PK
entity_type     TEXT     NOT NULL  -- task|note|study_session|reminder|goal|habit|system
entity_id       INTEGER  -- NULL for system events
action          TEXT     NOT NULL  -- created|updated|completed|started|stopped|etc
message         TEXT     NOT NULL  -- human-readable description
payload_json    TEXT     -- full context snapshot
source          TEXT     NOT NULL DEFAULT 'api'  -- api|cli|scheduler|system
actor           TEXT     NOT NULL DEFAULT 'user'
created_at      DATETIME NOT NULL
```

---

### devices (reserved)

```sql
id              INTEGER  PK
device_name     TEXT     NOT NULL
device_type     TEXT     -- mobile|desktop|tablet|tv|watch
platform        TEXT     -- android|ios|linux|windows|macos
trust_level     INTEGER  DEFAULT 0
trusted         BOOLEAN  DEFAULT false
last_seen_at    DATETIME
created_at      DATETIME
```

---

### ai_requests / ai_responses (reserved)

```sql
-- ai_requests
id              INTEGER  PK
request_type    TEXT     -- summarize|prioritize|plan|parse_command
prompt_text     TEXT
context_json    TEXT
status          TEXT     DEFAULT 'pending'
created_at      DATETIME
completed_at    DATETIME

-- ai_responses
id              INTEGER  PK
ai_request_id   INTEGER  FK → ai_requests(id)
response_text   TEXT
model_used      TEXT
tokens_used     INTEGER
metadata_json   TEXT
created_at      DATETIME
```

---

### Relationships Summary

```
subjects     → tasks (1:many)
subjects     → notes (1:many)
subjects     → study_sessions (1:many)
subjects     → reminders (1:many)
tasks        → task_history (1:many)
tasks        → tasks (1:many, parent/child subtasks)
notes        → note_versions (1:many)
habits       → habit_logs (1:many)
goals        → goals (1:many, parent/child hierarchy)
tasks        → reminders (1:many)
everything   → activity_logs (1:many, via entity_type + entity_id)
```

---

## 8. API Design

**Base URL:** `/api/v1`  
**Auth:** All routes require `Authorization: Bearer <api_key>` header except `/health` and `/version`  
**Format:** All responses follow the contract defined in Section 9

---

### Health

```
GET  /api/v1/health        → system status, DB ping, scheduler status
GET  /api/v1/version       → NARI version, uptime
```

---

### Auth

```
POST /api/v1/auth/verify   → validate API key, return user info
```

**Removed:** `POST /auth/login` and `POST /auth/logout` — these imply session management that does not exist in a static API key system.

---

### Tasks

```
GET    /api/v1/tasks                        → list tasks (filters: status, priority, subject_id, due_date, tag)
POST   /api/v1/tasks                        → create task
GET    /api/v1/tasks/{id}                   → get single task
PATCH  /api/v1/tasks/{id}                   → update task fields
DELETE /api/v1/tasks/{id}                   → soft delete (sets status=cancelled)
POST   /api/v1/tasks/{id}/complete          → mark complete, set completed_at
POST   /api/v1/tasks/{id}/reopen            → reopen completed task
GET    /api/v1/tasks/{id}/history           → full task_history for this task
GET    /api/v1/tasks/today                  → tasks due today + overdue
```

**Create request:**
```json
{
  "title": "Revise derivatives",
  "description": "Chain rule and applications",
  "priority": "high",
  "due_date": "2026-05-01",
  "subject_id": 2,
  "tags": ["math", "revision"],
  "estimated_minutes": 90
}
```

---

### Subjects

```
GET    /api/v1/subjects           → list all (filter: archived)
POST   /api/v1/subjects           → create
GET    /api/v1/subjects/{id}      → get with task count, study hours summary
PATCH  /api/v1/subjects/{id}      → update
DELETE /api/v1/subjects/{id}      → archive (sets archived_at, never hard delete)
GET    /api/v1/subjects/{id}/stats → study hours, task completion, session count
```

---

### Study

```
GET    /api/v1/study/current                 → active session or null
POST   /api/v1/study/start                   → start new session
POST   /api/v1/study/pause                   → pause active session
POST   /api/v1/study/resume                  → resume paused session
POST   /api/v1/study/stop                    → end session, calculate duration
GET    /api/v1/study/sessions                → list sessions (filter: subject_id, date range)
GET    /api/v1/study/today                   → today's total study time + sessions
GET    /api/v1/study/summary?date=YYYY-MM-DD → daily summary for a given date
GET    /api/v1/study/weekly                  → last 7 days breakdown by subject
```

**Start request:**
```json
{
  "subject_id": 2,
  "goal_text": "Finish chapter 3 exercises"
}
```

---

### Notes

```
GET    /api/v1/notes                         → list notes (filter: subject_id, tag, search query)
POST   /api/v1/notes                         → create, auto-saves version 1
GET    /api/v1/notes/{id}                    → get note with current content
PATCH  /api/v1/notes/{id}                    → update, auto-saves new version
DELETE /api/v1/notes/{id}                    → soft archive
GET    /api/v1/notes/{id}/versions           → list all saved versions
POST   /api/v1/notes/{id}/restore/{version_id} → restore note to a previous version
GET    /api/v1/notes/search?q=query          → full-text search across all notes
```

---

### Reminders

```
GET    /api/v1/reminders                     → list (filter: status, upcoming)
POST   /api/v1/reminders                     → create
GET    /api/v1/reminders/{id}
PATCH  /api/v1/reminders/{id}
DELETE /api/v1/reminders/{id}
POST   /api/v1/reminders/{id}/snooze         → body: { "minutes": 15 }
POST   /api/v1/reminders/{id}/dismiss        → mark dismissed
```

---

### Goals

```
GET    /api/v1/goals                         → list (filter: scope, status)
POST   /api/v1/goals                         → create
GET    /api/v1/goals/{id}
PATCH  /api/v1/goals/{id}
DELETE /api/v1/goals/{id}
POST   /api/v1/goals/{id}/progress           → body: { "increment": 1 } or { "value": 5 }
GET    /api/v1/goals/tree                    → nested hierarchy view
```

---

### Habits

```
GET    /api/v1/habits                        → list all habits
POST   /api/v1/habits                        → create
GET    /api/v1/habits/{id}
PATCH  /api/v1/habits/{id}
DELETE /api/v1/habits/{id}
POST   /api/v1/habits/{id}/complete          → log completion, update streak
GET    /api/v1/habits/{id}/logs              → completion history
GET    /api/v1/habits/today                  → today's habits with completion status
```

---

### Analytics

```
GET    /api/v1/analytics/dashboard           → overview: tasks done, study hours, streaks
GET    /api/v1/analytics/study               → study hours by subject, weekly trends
GET    /api/v1/analytics/tasks               → completion rate, overdue rate, by priority
GET    /api/v1/analytics/habits              → habit consistency, streak history
GET    /api/v1/analytics/activity            → recent activity feed from ActivityLog
GET    /api/v1/analytics/patterns            → behavioral patterns: peak study hours, task completion times
```

All analytics endpoints accept optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` query params.

---

### Activity

```
GET    /api/v1/activity                      → paginated activity log
GET    /api/v1/activity?entity_type=task     → filter by entity type
GET    /api/v1/activity?entity_id=42         → all events for one entity
```

---

**Removed endpoints:**
- `POST /api/v1/auth/login` — no sessions exist
- `POST /api/v1/auth/logout` — no sessions to destroy
- `POST /api/v1/cli/command` — dangerous generic endpoint; CLI calls specific REST routes like every other client

---

## 9. Response Contract

Every API response uses this shape. No exceptions. Frontend and CLI depend on this contract being consistent.

### Success

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

### Error

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

### Paginated list

```json
{
  "ok": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "per_page": 20,
    "has_more": false
  },
  "error": null
}
```

### Standard error codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Entity does not exist |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `CONFLICT` | 409 | State conflict (e.g. starting session when one is active) |
| `SERVER_ERROR` | 500 | Unexpected internal error |
| `ALREADY_COMPLETED` | 409 | Task or session already in terminal state |

---

## 10. WebSocket Event Map

**Endpoint:** `ws://<pi-ip>:8000/ws`  
**Auth:** API key passed as query param on connect: `/ws?token=<api_key>`

### Event envelope (all events use this shape)

```json
{
  "event": "task_created",
  "entity_type": "task",
  "entity_id": 12,
  "timestamp": "2026-04-28T10:00:00Z",
  "data": {}
}
```

### Who emits, who listens

- **Emits:** Services, after successful DB commit
- **Listens:** Web dashboard, future CLI refresh layer, future Android client
- **Broker:** In-process event bus (`core/events.py`) — no Redis, no external broker

---

### Connection events

| Event | Trigger |
|---|---|
| `client_connected` | New WebSocket connection established |
| `client_disconnected` | WebSocket connection closed |

### Task events

| Event | Trigger |
|---|---|
| `task_created` | New task saved |
| `task_updated` | Any task field changed |
| `task_completed` | Task marked complete |
| `task_deleted` | Task cancelled/deleted |

### Subject events

| Event | Trigger |
|---|---|
| `subject_created` | New subject saved |
| `subject_updated` | Subject fields changed |
| `subject_archived` | Subject archived |

### Study events

| Event | Trigger |
|---|---|
| `study_started` | Session begins |
| `study_paused` | Session paused |
| `study_resumed` | Session resumed |
| `study_stopped` | Session ended with duration |

**`study_tick` is intentionally NOT included.** The frontend runs its own local JavaScript timer after receiving `study_started`. The backend is the source of truth only at lifecycle events (start/pause/resume/stop). This keeps the WebSocket clean and the backend stateless between session events.

### Note events

| Event | Trigger |
|---|---|
| `note_created` | New note saved |
| `note_updated` | Note content changed (version saved) |
| `note_deleted` | Note archived |

### Reminder events

| Event | Trigger |
|---|---|
| `reminder_created` | New reminder saved |
| `reminder_triggered` | Scheduler fires a reminder |
| `reminder_snoozed` | Reminder snoozed |
| `reminder_dismissed` | Reminder dismissed |

### Goal & Habit events

| Event | Trigger |
|---|---|
| `goal_created` | New goal saved |
| `goal_progress_updated` | Progress value changed |
| `habit_completed` | Habit logged for today |
| `habit_streak_updated` | Streak count changed |

### System events

| Event | Trigger |
|---|---|
| `activity_logged` | Any ActivityLog entry written |

---

## 11. ActivityLog Specification

The ActivityLog is the memory layer of NARI. It accumulates behavioral data from day one so the future AI layer has real history to reason about.

### Rules — non-negotiable

1. Every service method that modifies state MUST write to ActivityLog
2. ActivityLog writes happen AFTER successful DB commit, never before
3. ActivityLog is append-only — never update or delete entries
4. If an ActivityLog write fails, log the error but do NOT roll back the main operation
5. ActivityLog writes must be non-blocking — use background task if they become slow

### Standard action verbs

```
created | updated | completed | deleted | archived | restored
started | paused | resumed | stopped
triggered | snoozed | dismissed
logged | incremented | streaked
```

### Example entries

```json
{ "entity_type": "task", "entity_id": 5, "action": "completed",
  "message": "Task 'Revise derivatives' marked complete",
  "source": "api", "actor": "user" }

{ "entity_type": "study_session", "entity_id": 12, "action": "stopped",
  "message": "Study session for Physics ended. Duration: 47 minutes.",
  "payload_json": "{\"subject\": \"Physics\", \"duration_seconds\": 2820, \"interrupts\": 1}",
  "source": "api", "actor": "user" }

{ "entity_type": "reminder", "entity_id": 3, "action": "triggered",
  "message": "Reminder 'Review organic chemistry' fired",
  "source": "scheduler", "actor": "system" }
```

---

## 12. Build Order & Milestones

**Governing rule:** Never start a new stage until the current stage is in daily use.

---

### Stage 0 — Skeleton (3–5 days)

**Goal:** Server starts, DB connects, health check responds. Nothing useful yet, but foundations are correct.

| Day | Tasks |
|---|---|
| 1 | Create repo + folder structure. Init Python project (pyproject.toml). Init Vite project. Add `.env.example`. Define naming conventions doc. |
| 2 | Create `app/main.py`. Add config loader (`core/config.py`). Define SQLModel base. Create SQLite engine with WAL mode. Wire startup/shutdown lifecycle. |
| 3 | Add Alembic. Create initial empty migration. Verify `alembic upgrade head` runs. Create `GET /api/v1/health` endpoint. Add API key middleware (`core/security.py`). |
| 4 | Create `activity_service.py` skeleton. Create `activity_log` model + migration. Add structured logging. Add global exception handler with standard error shape. |
| 5 | Write smoke tests: server starts, health returns 200, auth middleware rejects bad key, DB read/write works. **Freeze Stage 0 when all smoke tests pass.** |

**Done when:** `GET /api/v1/health` returns `{"ok": true}` with valid API key, rejects without it.

---

### Stage 1 — Tasks (7–10 days)

**Goal:** Manage all tasks from terminal. NARI enters daily use.

| Day | Tasks |
|---|---|
| 1 | Create `Task` model + migration. Create `TaskHistory` model + migration. Run migrations. |
| 2 | Create `task_service.py`: create, get, list, update, delete, complete, reopen. Every method writes to ActivityLog. |
| 3 | Create task API routes (`api/v1/tasks.py`). Create Pydantic schemas (`schemas/task.py`). Wire routes to service. |
| 4 | Add task filtering: by status, priority, subject_id, due_date. Add `GET /tasks/today`. |
| 5 | Write `cli/nari.py` with task commands: `add`, `list`, `done`, `view`. CLI makes HTTP requests — no business logic. |
| 6 | Add task history recording in service. Add `GET /tasks/{id}/history`. |
| 7 | Write tests: task CRUD, status transitions, ActivityLog entries, auth check. Test on Server-01. |
| 8–10 | Use NARI daily for task management. Fix friction. Polish error messages. |

**Done when:** You have stopped using any other tool to manage tasks.

---

### Stage 2 — Subjects + Study (7–10 days)

**Goal:** Track every study session. Subject-level analytics begin.

| Day | Tasks |
|---|---|
| 1–2 | Subject model + service + API routes + CLI commands |
| 3–4 | StudySession model (with interrupt_count, interruptions_json) + migration |
| 5–6 | Study service: start, pause, resume, stop. Duration calculated on stop. Interrupt count incremented on pause. |
| 7 | Study API routes. `GET /study/current`, `GET /study/today`, `GET /study/summary`. |
| 8–10 | CLI study commands. Tests. Daily use begins. |

**Done when:** Every study session is tracked through NARI.

---

### Stage 3 — Notes (7–10 days)

**Goal:** All notes live in NARI. Versioned from day one.

| Day | Tasks |
|---|---|
| 1–2 | Note + NoteVersion models + migrations |
| 3–4 | Note service: CRUD + auto-version on every save + restore |
| 5–6 | Note API routes. Full-text search via SQLite FTS5. |
| 7–8 | CLI note commands: `add`, `list`, `view`, `search` |
| 9–10 | Tests. Daily use begins. |

---

### Stage 4 — Web Dashboard (2 weeks)

**Goal:** NARI has a face. Accessible on phone and laptop.

- React + Vite + Tailwind setup
- Nginx serves `/` from `frontend/dist`
- API calls proxied to `/api/`
- Auth: API key entry screen, stored in localStorage
- Pages: Today, Tasks, Study, Notes
- Mobile-first layout — works on phone browser
- Subtle animations acceptable — Server-01 has no performance constraint

**Done when:** You open NARI on your phone every morning.

---

### Stage 5 — WebSockets (5–7 days)

**Goal:** Changes appear live without page refresh.

- `websocket/manager.py` — connection registry
- Event bus in `core/events.py`
- Services emit events after DB commit
- Frontend subscribes, React Query invalidates on event
- Study timer runs locally in JS — backend only confirms state at lifecycle events

---

### Stage 6 — Reminders (5–7 days)

**Goal:** NARI tells you what to do and when.

- Reminder model + APScheduler jobs
- Browser Web Push Notifications API
- One-time and recurring reminders (RRULE)
- Snooze and dismiss

---

### Stage 7 — Goals + Habits (1–2 weeks)

**Goal:** Daily actions connect to long-term vision.

- Goal hierarchy (yearly → quarterly → monthly → weekly → daily)
- Tasks link to goals
- Habit streaks, habit_logs
- Goals and Habits pages in web dashboard

---

### Stage 8 — Analytics (5–7 days)

**Goal:** NARI shows you patterns in your own behavior.

- Query ActivityLog and StudySession for behavioral patterns
- Charts: study hours by subject, task completion rate, habit streaks
- Burnout signals: days with zero study + high overdue tasks
- Peak productivity windows from ActivityLog timestamps

**Note:** Analytics on 2+ months of real data is meaningful. Analytics on 1 week is noise. Build this after you have data.

---

### Stage 9 — AI Layer (1 week, when ready)

**Goal:** NARI reasons about the data it has been collecting about you.

- `ai/` folder activation
- Groq API client wrapper (httpx)
- Prompt templates per feature
- New endpoints: `POST /ai/summarize-notes`, `POST /ai/suggest-tasks`, `POST /ai/reflect-week`, `POST /ai/parse-command`
- AI panel in web dashboard
- AI writes nothing to DB directly — suggestions only

---

## 13. Deployment Setup — Server-01

**Server-01 specs:** Intel i5-2400S, 8GB DDR3, 500GB HDD, Ubuntu Server 24.04 LTS

### Prerequisites

```bash
# SSH into Server-01 from your laptop
ssh ankit@192.168.1.xxx

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3.12 python3.12-venv python3-pip nginx git curl -y

# Verify Python
python3.12 --version
```

### Create dedicated user and project folder

```bash
# Create nari user (optional but clean)
sudo useradd -m -s /bin/bash nari

# Or use your own user
mkdir -p /home/ankit/nari
cd /home/ankit/nari
git clone <your-repo> .
```

### Backend setup

```bash
cd /home/ankit/nari/backend

python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your API key and settings
nano .env

# Run migrations
alembic upgrade head
```

### systemd service

**File:** `/etc/systemd/system/nari.service`

```ini
[Unit]
Description=NARI Backend — Server-01
After=network.target

[Service]
User=ankit
WorkingDirectory=/home/ankit/nari/backend
EnvironmentFile=/home/ankit/nari/backend/.env
ExecStart=/home/ankit/nari/backend/.venv/bin/uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 2 \
  --log-level info \
  --no-access-log
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nari
sudo systemctl start nari
sudo systemctl status nari
```

### Nginx config

**File:** `/etc/nginx/sites-available/nari`

```nginx
server {
    listen 80;
    server_name _;

    # Frontend — serve built static files
    location / {
        root /home/ankit/nari/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # remove default nginx page
sudo nginx -t
sudo systemctl restart nginx
```

### Frontend build

**Build on your laptop, deploy to Server-01:**

```bash
# On your laptop
cd frontend
npm install
npm run build

# Deploy to Server-01
rsync -avz dist/ ankit@192.168.1.xxx:/home/ankit/nari/frontend/dist/
```

### SQLite WAL mode activation

Add to `db/session.py` engine creation:

```python
with engine.connect() as conn:
    conn.execute(text("PRAGMA journal_mode=WAL"))
    conn.execute(text("PRAGMA synchronous=NORMAL"))
    conn.execute(text("PRAGMA cache_size=-128000"))  # 128MB cache (Server-01 has headroom)
    conn.execute(text("PRAGMA temp_store=MEMORY"))
    conn.execute(text("PRAGMA mmap_size=268435456"))  # 256MB memory-mapped I/O
```

### Backup script

**File:** `deploy/backup.sh`

```bash
#!/bin/bash
BACKUP_DIR="/home/ankit/nari/data/backups"
DATE=$(date +%Y-%m-%d_%H-%M)
mkdir -p "$BACKUP_DIR"

# SQLite backup (safe with WAL mode)
sqlite3 /home/ankit/nari/data/nari.db ".backup '$BACKUP_DIR/nari_$DATE.db'"

# Keep last 60 backups (500GB HDD has space)
ls -t "$BACKUP_DIR"/nari_*.db | tail -n +61 | xargs rm -f

echo "Backup complete: nari_$DATE.db"
```

```bash
chmod +x deploy/backup.sh
# Daily at 3am
crontab -e
# 0 3 * * * /home/ankit/nari/deploy/backup.sh
```

### Health monitoring

```bash
# Service status
sudo systemctl status nari

# Live logs
sudo journalctl -u nari -f

# Memory usage
free -h
ps aux | grep uvicorn

# Disk usage
df -h /home/ankit/nari/data

# Test API
curl -H "Authorization: Bearer your-api-key" http://localhost:8000/api/v1/health
```

### Auto-start on boot

```bash
# Enable both services on boot
sudo systemctl enable nari
sudo systemctl enable nginx

# Verify enabled
sudo systemctl is-enabled nari
sudo systemctl is-enabled nginx
```

---

## 14. Engineering Rules

These are non-negotiable. Every line of code must respect them.

1. **Routes never touch the database.** Routes call services. Services touch the database.
2. **Services never call other services directly.** Use the event bus for cross-service communication.
3. **AI never writes to the database without validation.** AI returns suggestions; the user or service confirms and writes.
4. **Every service method that modifies state writes to ActivityLog.** No exceptions.
5. **No blocking calls on the main thread.** APScheduler jobs and long operations use background tasks.
6. **Files stay under 250 lines.** If a file grows beyond this, split it.
7. **All services follow the same pattern.** `create()`, `get()`, `list()`, `update()`, `delete()` — every service has these or a subset.
8. **The CLI calls the API.** It never imports from the backend app directly.
9. **All timestamps are stored as UTC.** Timezone conversion happens at the presentation layer.
10. **Never hard-delete a subject or note.** Use `archived_at`. Tasks use `status=cancelled`.
11. **Schema changes require an Alembic migration.** Never modify the DB directly in production.
12. **Every model is time-aware from day one.** `created_at` and `updated_at` on everything.
13. **Build for mobile-first.** Every UI decision is tested on a phone screen before laptop.
14. **Monitor Server-01 health regularly.** Use `free -h` and `df -h` to track memory and disk usage. Target: backend under 500MB RAM, DB under 10GB for first 2 years.

---

## 15. AI Layer — Reserved (Stage 9)

The `ai/` folder exists from day one but contains only a placeholder. When Stage 9 arrives:

**What gets built:**
- `ai/client.py` — AI API wrapper (Ollama or Groq, switchable via config)
- `ai/prompts/` — prompt templates per feature (summarize_note, suggest_tasks, reflect_week)
- `ai/router.py` — decides which prompt template to use
- `ai/context_builder.py` — queries ActivityLog and services to build context for prompts

**Two AI options available on Server-01:**

| Option | Model | Where | Cost | Privacy |
|---|---|---|---|---|
| **Ollama (Recommended)** | Llama 3.1 8B | Runs locally on Server-01 | Free forever | 100% private |
| Groq API | Llama 3.3 70B | Cloud | Free tier available | Data leaves home |

Server-01's 8GB RAM runs Llama 3.1 8B comfortably via Ollama. This was impossible on Pi 3B. Full local AI is now viable.

**How context works (RAG approach):**
- AI endpoint receives a request type (e.g. `reflect_week`)
- `context_builder` queries last 7 days of ActivityLog, completed tasks, study sessions
- Context is assembled into a structured prompt
- Model returns a response
- Response is displayed to user — never written to DB directly

**To install Ollama when ready (Stage 9):**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b
```

**AI model this replaces:** Fine-tuning on a laptop is not recommended. The ActivityLog data NARI accumulates is behavioral event data, not instruction-response pairs needed for fine-tuning. RAG over real personal data via Ollama will outperform any fine-tuned model for NARI's use cases — and it runs entirely on Server-01 for free.

---

## 16. Future Roadmap

| Year | Focus | Key Deliverables |
|---|---|---|
| Year 1 | Foundation | Stages 0–5. Core features working, daily use established. |
| Year 2 | Intelligence | Stages 6–9. Reminders, goals, habits, analytics, AI layer. |
| Year 3 | Platform | Plugin system, automation rules, calendar integration, PWA improvements. |
| Year 4 | Ecosystem | Voice input pipeline, advanced memory, device management, optional multi-user. |
| Year 5 | Scale | Native desktop client, stronger encryption, remote access, richer AI planning. |

---

*This document is the single source of truth for NARI v3 architecture. All build decisions must reference this document. When decisions change, update this document first.*
