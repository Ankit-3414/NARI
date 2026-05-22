# NARI System Verification Checklist

## Phase 1: Backend API & Business Logic (Current Status: [DONE])

### Core Infrastructure
- [x] **Health & Auth:** `GET /api/v1/health` returns 200 with valid key, 401 without.
- [x] **Database:** SQLite WAL mode is active.
- [x] **Migrations:** All tables (`tasks`, `study_sessions`, `notes`, `reminders`, `goals`, `habits`, `activity_logs`, `task_history`) exist.
- [x] **Scheduler:** APScheduler is running and polling (verified via logs).
- [x] **WebSockets:** Server accepts connections at `/ws?token=...` (verified via `test_ws_connection.py`).

### Task Management
- [x] **CRUD:** Create, Read, List (with filters) verified via CLI.
- [x] **Transitions:** Complete/Reopen works and updates `completed_at` (tested in Stage 1/2).
- [x] **History:** `task_history` records all changes (verified via CLI `history`).
- [x] **Logging:** All actions written to `activity_log` (verified via CLI `activity`).

### Study & Subjects
- [x] **Subjects:** CRUD and archiving works (verified via CLI).
- [x] **Session Lifecycle:** Start -> Pause -> Resume -> Stop cycle calculates duration (verified via CLI `study-status`).
- [x] **Interruptions:** Pause increments `interrupt_count` (verified in tests).
- [x] **Stats:** `GET /study/today` returns accurate cumulative time (verified in tests).

### Notes & Versions
- [x] **Versioning:** Every `PATCH` creates a new entry in `note_versions` (verified via CLI `note-history`).
- [x] **Content:** Markdown content is stored and retrieved correctly.

### Goals & Habits
- [x] **Habits:** Logging completion updates `current_streak`. (Bug fix: added missing events in `EventNames`).
- [x] **Goals:** Progress increments update `current_value` and auto-complete (verified via CLI).

### Analytics
- [x] **Summary:** Dashboard summary returns aggregate data (verified via curl).
- [x] **Trends:** Study trends return correct daily buckets (verified via curl).

---

## Phase 2: Frontend UI/UX (Current Status: [IN_PROGRESS])

### Dashboard (Today Page)
- [ ] **Quick Stats:** Focus time and Task count reflect real backend data.
- [ ] **Active Session:** Timer widget appears when a session is running.
- [ ] **Today's Tasks:** Shows only pending/relevant tasks.
- [ ] **Habit Widget:** One-click completion works.

### Feature Pages
- [ ] **Tasks:** Filters and list view work.
- [ ] **Study:** Subject selection and session controls work.
- [ ] **Notes:** Markdown preview and editor work.
- [ ] **Analytics:** Bar/Pie charts render with data.
- [x] **Reminders:** Notification dot and list view include triggered signals; scheduler trigger path covered by tests.

### Global Features
- [x] **WebSocket Sync:** UI updates instantly (verified backend emitting logic and frontend cache invalidation).
- [x] **Auth Gate:** LoginPage appears if API key is missing (verified security middleware).
- [x] **Responsiveness:** Layout works on mobile-sized viewports (verified `MobileLayout.jsx` logic).

---

## Phase 3: CLI Thin Client (Current Status: [DONE])
- [x] **Tasks:** `list`, `add`, `done` work.
- [x] **Study:** `study-start`, `study-stop` work.
- [x] **Goals/Habits:** New commands work as expected.
