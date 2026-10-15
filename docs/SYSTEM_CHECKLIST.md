# NARI System Verification Checklist

This checklist records the current verified system surface for v1.0.0-alpha.11. It is a status reference, not a full test plan.

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

## Phase 5: Stage 9 (AI Co-pilot Integration)

Current status: done.

- [x] Intent routing engine fully implemented (NIMClient ToolRegistry with 28+ tools supporting full CRUD across tasks, notes, habits, goals, reminders, subjects, study sessions, physical locations, context stream logging, semantic searching, core memory retention, server health inspection, and maintenance).
- [x] Multi-turn conversation history forwarded from frontend IndexedDB storage through `useAiChat` to NVIDIA NIM completions.
- [x] Semantic memory storage using SQLModel `knowledge_nodes` backed by SQLite and local sqlite_vec vector database.
- [x] Context & Persona Retrieval boundary defined and integrated in context_builder.py using SentenceTransformers (all-MiniLM-L6-v2) for local embedding generation.
- [x] Conversational pre-filtering and system prompt negative constraints implemented to guarantee zero function-calling or parameter meta-talk.
- [x] Web Search co-pilot tool integrated into the registry using SearXNG meta-search API.
- [x] Weather-Aware AI Intent Routing (injects current temperature, location, and conditions into LLM context window).
- [x] Reactive Cyberpunk HUD backdrop states (Amber radial gradient for Sunny, Cyan fast scanlines for Stormy/Rainy, Blur haze overlay for Foggy).
- [x] Neural Daily Productivity Briefing (scheduler manager auto-compiles weather/objective telemetry at 8:00 AM local time).
- [x] Dynamic Settings suggestions geocoding dropdown (with arrow-key navigation, scrolling container, recent searches local index, and matching prefix highlighting).

## Phase 6: Stage 9.5 (Spatial OS & Geofencing)

Current status: done.

- [x] Database: Migration added for `location_nodes` representing geofences.
- [x] API Layer: Location CRUD endpoints implemented with activity logging and Alembic migration.
- [x] Frontend Map Dashboard: Leaflet-powered visual interface supporting Vector, Satellite, and Hybrid layers with manual click-to-pin, address Neural Search, and high-accuracy mount auto-centering.
- [x] Proactive Geofencing: Local geofencing background engine (`useSpatialAwareness`) calculating Haversine distance and triggering native browser alerts.
- [x] Battery & Polling Optimizations: Adaptive geolocation polling (scales down to 30s when stationary, 5s when moving).
- [x] Category Presets: Automated radius configuration based on categories (Home/Study=50m, Work=100m, Shopping=300m).
- [x] AI NLP Intent: "When I Reach" natural language intent parser scheduling tasks linked directly to physical location IDs.

