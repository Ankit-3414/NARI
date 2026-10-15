# NARI Project Audit & V1 Modification Plan

**Date:** 2026-10-15  
**Version:** v1.0.0-alpha.11  
**Scope:** Full codebase audit against all system architecture, past audit logs, and v1 blueprints.

---

## 1. Goal Description

Conduct a thorough audit of the NARI platform across all technical specifications, architectural documentation (`NARI_Architecture.md`, `NARI_V1_VISION.md`, `NARI_V1_ARCHITECTURE.md`, `NARI_V1_Intelligence_Implementation_Plan.md`, `DESIGN_OVERHAUL.md`, `AUDIT_CLAUDE.md`), evaluate the codebase against these requirements, and define concrete modification tracks for implementing the next phase of NARI.

---

## 2. Comprehensive Codebase Audit

### 2.1 Current System State (v1.0.0-alpha.11)
NARI is currently at Stage 9.5 (Spatial Awareness & Geofencing) with extensive Sovereign AGI functionality integrated via NVIDIA NIM (LLaMA 3.1 70B), local semantic memory (SQLite + `sqlite_vec`), Keyless Web Research & Reasoning Engine, APScheduler background jobs, and reactive UI overlays.

### 2.2 Verification of Past Audit Items (`AUDIT_CLAUDE.md`)
A deep verification of the 18 issues documented in `AUDIT_CLAUDE.md` revealed that the majority have been successfully remediated in recent iterations:

| # | Audit Item | Status in Current Code | Verification Evidence |
|---|---|---|---|
| 1 | Habit `h.title` vs `h.name` bug in AI tools | **RESOLVED** | `backend/app/ai/tools.py:1038` correctly references `h.name`. |
| 2 | Timezone-naive comparison in scheduler | **RESOLVED** | `backend/app/scheduler/manager.py:78,109` normalizes `now = datetime.now(UTC).replace(tzinfo=None)`. |
| 3 | Conversation history omitted from LLM | **RESOLVED** | `AssistantDrawer.jsx` loads and passes history to `useAiChat`, and `llm_client.py:166-173` prepends turns. |
| 4 | `digest_context` race condition | **RESOLVED** | `backend/app/services/context_service.py:43-46` wraps digestion in `asyncio.Lock()`. |
| 5 | API key stored in `localStorage` | **RESOLVED** | `frontend/src/store/authStore.js` only stores `NARI_SESSION_ACTIVE` flag; key is kept in-memory. |
| 6 | `LoginPage` omitting API key | **RESOLVED** | `frontend/src/pages/LoginPage.jsx:23` calls `setAuthenticated(true, key.trim())`. |
| 7 | Default credentials `neural_link_established` | **OPEN / MINOR** | Still present as placeholder in `.env.example`. Needs production startup guard. |
| 8 | `AI_ENABLED` flag not enforced on endpoints | **RESOLVED** | `backend/app/api/v1/ai.py:19-29` enforces `verify_ai_enabled` dependency with HTTP 403. |
| 9 | Single tool call per turn constraint | **INTENTIONAL** | Restricted to 1 per turn (`llm_client.py:197`) due to NVIDIA NIM template constraint. |
| 10 | Recurring reminder drift | **RESOLVED** | `reminder_service.py:179` uses `rule.after(max(due_naive, now_naive))`. |
| 11 | Scheduler 1-second polling overhead | **RESOLVED** | `manager.py:35` adjusted to 15s interval for reminders, 10s for ghosting, 8:00 AM for daily briefing. |
| 12 | Dead GROQ/Anthropic config variables | **RESOLVED** | Cleared out of `config.py`; only NVIDIA NIM and Keyless Web Engine are retained. |
| 13 | `search_memory` using plain SQL `LIKE` | **RESOLVED** | `tools.py:933` routes knowledge queries through `semantic_memory.search_knowledge`. |
| 14 | Missing AI CRUD tools | **RESOLVED** | `tools.py` expanded from 5 tools to 28+ tools covering tasks, notes, habits, goals, reminders, subjects, study sessions, locations, and server health. |
| 15 | `useSyncEngine` missing reminders/study | **RESOLVED** | `useSyncEngine.js:83-111` includes full offline sync handlers for reminders and study sessions. |
| 16 | WebSocket drop without reconnection | **RESOLVED** | `websocket.js:67-76` implements exponential backoff reconnection (`attemptReconnect`). |
| 17 | Duplicate experiment components | **RESOLVED** | `frontend/src/experiments/` has been purged. |
| 18 | Hardcoded LAN IP in CORS | **RESOLVED** | `main.py:88-94` replaces static IP with `nari.lan`, `nari.run.place`, `nari.local`. |

---

### 2.3 Remaining Architecture & Design Gaps (Towards NARI v1)
While the core platform is stable, comparing the current system against the newly drafted NARI v1 blueprints (`NARI_V1_VISION.md`, `NARI_V1_ARCHITECTURE.md`, `NARI_V1_Intelligence_Implementation_Plan.md`) highlights key areas ready for development:

1. **Flat Memory vs Versioned Memory**:
   - *Current*: `KnowledgeNode` overwrites concepts on conflict (`upsert` behavior in `SemanticMemoryService`).
   - *V1 Target*: `memory_versions`, `memory_edges`, and `provenance_links` so changes in beliefs are versioned and queryable over time, with conflicts flagged (`needs_review=True`).
2. **Hardcoded Persona vs Dynamic Identity Profile**:
   - *Current*: LLM persona directives are hardcoded strings in `llm_client.py:120-161`.
   - *V1 Target*: `identity_profile` table supporting tone, communication style, phrasing rules, and versioning.
3. **Scheduled Slow-Loop Reflection**:
   - *Current*: AI only reacts to immediate chat turns and triggers immediate digestion upon context log.
   - *V1 Target*: Nightly `reflection_runs` job analyzing daily event clusters, proposing belief updates, and surfacing proactive summaries.
4. **Awareness Layer & Route Tracking**:
   - *Current*: Context window collects weather, active tasks, reminders, and recent logs, but has no concept of `current_page` or `current_project`.
   - *V1 Target*: Frontend awareness ping (`POST /api/v1/awareness/ping`) saving to `awareness_snapshots`.
5. **The Bridge (UI Presentation)**:
   - *Current*: Root route renders `TodayPage` with classic dashboard cards.
   - *V1 Target*: "The Bridge" with cinematic entrance sequence (dark -> pulse -> greeting -> awareness summary -> interactive globe -> chat drawer/input).
6. **Tool Coverage Gaps**:
   - Analytics metrics (`get_dashboard_summary`, `get_study_trends`, etc.) currently have no AI read tools.
   - Locations lack `update_location` and `delete_location` tools.

---

## 3. Recommended Modification Tracks

### Option 1: Track A — Intelligence Engine (Backend Core)
Focus purely on the data, reasoning, and memory architecture:
- Create Alembic migration and models for `MemoryVersion`, `MemoryEdge`, `ProvenanceLink`, `IdentityProfile`, `ReflectionRun`, and `AwarenessSnapshot`.
- Refactor `semantic_memory.py` to write versioned memory chains and preserve historical provenance.
- Migrate `llm_client.py` system prompt to load the active `IdentityProfile`.
- Add nightly reflection APScheduler job (`run_nightly_reflection`).
- Add awareness endpoint (`POST /api/v1/awareness/ping`).
- Add missing AI tools for Analytics and Locations.

### Option 2: Track B — The Bridge & Living OS (Frontend Visual Overhaul)
Focus on the experiential and visual presentation from `NARI_V1_VISION.md` and `NARI_V1_OPENING_FLOW.md`:
- Build the **Bridge** homepage (`BridgePage.jsx`), replacing the dense dashboard entry with presence, greeting, awareness statement, and globe.
- Implement the opening sequence (black screen fade, NARI mark pulse, awareness summary fade-in).
- Implement the interactive Globe with smooth zoom into the expanded **World View** (weather, geofences, physical location).
- Convert sidebar to an auto-hiding off-canvas drawer that reveals the deeper pages upon request.

### Option 3: Track C — End-to-End V1 Vertical Slice (Recommended)
Deliver a cohesive slice across both backend intelligence and the new frontend experience:
1. **Backend**:
   - Add `awareness_snapshots` and `identity_profile` models with migration.
   - Implement `POST /api/v1/awareness/ping` and awareness summary generator.
2. **Frontend**:
   - Implement **The Bridge** as the default entry point.
   - Wire the live Awareness Summary into the Bridge greeting.
   - Retain full access to all existing pages (Tasks, Notes, Spatial, Habits, Analytics) via the responsive auto-hiding menu.

---

## 4. Verification Plan

### Automated Verification
- Backend migrations: `uv run alembic upgrade head`
- Backend test suite: `uv run pytest`
- API endpoint verification: HTTP curl checks against `/api/v1/health`, `/api/v1/ai/context`, and awareness endpoints.

### Manual Verification
- Verify Bridge opening animation sequence in browser.
- Verify that navigating routes correctly pings awareness state.
- Test AI chat conversational context retention with versioned identity.
