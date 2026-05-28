# NARI System Verification Checklist

This checklist records the current verified system surface for v1.0.0-alpha.7. It is a status reference, not a full test plan.

## Phase 1: Backend API and Business Logic

Current status: done.

### Core Infrastructure

- [x] Health and auth: `GET /api/v1/health` returns 200 with a valid key and 401 without one.
- [x] Database: SQLite WAL mode is active.
- [x] Migrations: Core tables exist for tasks, study sessions, notes, reminders, goals, habits, activity logs, and task history.
- [x] Scheduler: APScheduler runs reminder polling jobs.
- [x] WebSockets: Server accepts connections at `/ws?token=...`.

### Task Management

- [x] CRUD: Create, read, list, and filter work through the CLI/API.
- [x] Transitions: Complete and reopen update state and timestamps.
- [x] History: `task_history` records task changes.
- [x] Logging: Task actions write ActivityLog entries.

### Study and Subjects

- [x] Subjects: CRUD and archiving work.
- [x] Session lifecycle: Start, pause, resume, and stop calculate session duration.
- [x] Interruptions: Pause increments interruption count.
- [x] Stats: Study summary endpoints return daily cumulative time.

### Notes and Versions

- [x] Versioning: Note updates create `note_versions` entries.
- [x] Content: Markdown content is stored and retrieved correctly.

### Goals and Habits

- [x] Habits: Completion logging updates streak state.
- [x] Goals: Progress updates current value and can auto-complete goals.

### Analytics

- [x] Summary: Dashboard summary returns aggregate data.
- [x] Trends: Study trends return daily buckets.

## Phase 2: Frontend UI and UX

Current status: done.

### Dashboard

- [x] Quick stats reflect backend data.
- [x] Active session timer appears when a study session is running.
- [x] Today's tasks show pending and relevant tasks.
- [x] Habit widget supports one-click completion.
- [x] Context input supports fast daily logging.

### Feature Pages

- [x] Tasks: Filters and list view work.
- [x] Study: Subject selection and session controls work.
- [x] Notes: Markdown preview, editor, and version history work.
- [x] Analytics: Charts render with backend data.
- [x] Reminders: Notification state and triggered signals appear in app surfaces.
- [x] Goals and habits: Progress and streak workflows are available.

### Global Features

- [x] WebSocket sync updates the UI without refresh.
- [x] Auth gate appears when the API key is missing.
- [x] Responsive layout works on mobile and desktop.
- [x] Offline status is visible in the UI.

## Phase 3: CLI Thin Client

Current status: done.

- [x] Tasks: `list`, `add`, and `done` work.
- [x] Study: `study-start` and `study-stop` work.
- [x] Goals and habits: Commands work as expected.
- [x] Context Stream: `tell` logs raw context.

## Phase 4: Neural Offline Protocol

Current status: done.

### Progressive Web App

- [x] Manifest configured for installation.
- [x] Icons and splash assets are integrated.
- [x] Service worker caches static assets.

### Data Persistence

- [x] IndexedDB is integrated for local entity caching.
- [x] Offline indicators show connectivity state.

### Sync Engine

- [x] Offline actions queue for core entities.
- [x] Reconnection reconciles queued changes with the server.

## Phase 5: Stage 9 Readiness

Current status: pending.

- [ ] Intent engine design finalized.
- [ ] Semantic memory storage selected.
- [ ] Retrieval/indexing boundary defined.
- [ ] Nightly consolidation job design finalized.
- [ ] First useful AI suggestion workflow implemented.
