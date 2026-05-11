# NARI Technical Architecture Document

**Version:** v1.0.0-alpha.6  
**Status:** In Development (Stage 8)  
**Last Updated:** 2026-05-10  
**Author:** Ankit (Solo Developer)  
**System Type:** Self-hosted personal productivity and intelligence platform  
**Primary Server:** Server-01 (Intel i5-2400S, 8GB RAM, 500GB HDD)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Hardware Profile](#2-hardware-profile--server-01)
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

NARI (Not A Random Intelligence) is a local-first, self-hosted personal operating system for one person. It combines task management, study tracking, notes, goals, habits, reminders, and analytics into a single system that runs permanently on Server-01 and is accessible from any desktop device on the home network via browser.

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
| Styling | Tailwind CSS | Utility-first |
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

## 12. Build Order & Milestones

**Governing rule:** Never start a new stage until the current stage is in daily use.

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

## 16. Future Roadmap

| Year | Focus | Key Deliverables |
|---|---|---|
| Year 1 | Foundation | Stages 0–5. Core features working, daily use established. |
| Year 2 | Intelligence | Stages 6–9. Reminders, goals, habits, analytics, AI layer. |
| Year 3 | Platform | Plugin system, automation rules, calendar integration, web improvements. |
| Year 4 | Ecosystem | Voice input pipeline, advanced memory, desktop management, optional multi-user. |
| Year 5 | Scale | Native desktop client, stronger encryption, remote access, richer AI planning. |

---

*This document is the single source of truth for NARI v3 architecture. All build decisions must reference this document. When decisions change, update this document first.*
