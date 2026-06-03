# NARI (Not A Random Intelligence)

**NARI** is a local-first, self-hosted personal productivity platform designed to act as a private personal operating system. It combines task management, study tracking, notes, goals, habits, reminders, offline access, and behavioral analytics into one cohesive system.

> **Philosophy:** AI-ready but AI-deferred. NARI logs meaningful activity from day one so a useful behavioral dataset exists before the Stage 9 AI layer arrives. The system remains fully usable without AI.

---

## Key Features

- **Task Intelligence:** Task management with priorities, status transitions, history tracking, and focused "Today" views.
- **Study Core:** Subject-based focus sessions with pause/resume, interruption tracking, and daily study analytics.
- **Neural Notes:** Markdown notes with automatic version history and search-ready content.
- **Vision Tracking:** Goals and habits with progress tracking, streaks, and daily check-ins.
- **Reminders:** Scheduler-backed reminders with browser notifications and missed-signal handling.
- **Context Stream:** Fast natural-language logging through the CLI, API, and dashboard. Raw logs are digested automatically in the background by NVIDIA NIM to synthesize and learn personal preferences, identity details, and operational rules, storing them as vector memories. Includes archive page, search, filters, mood detection, and export.
- **Behavioral HUD:** Analytics for tasks, study, habits, goals, and activity patterns.
- **Neural Offline Protocol:** PWA installation, local caching, IndexedDB persistence, and background sync for core entities.
- **Neural Link:** API-first architecture with WebSocket-driven real-time UI updates.
- **Web Co-pilot:** Live meta-search capability (via **SearXNG**) allowing NARI to search 70+ sources for coding documentation, news, or general knowledge autonomously and privately.
- **Spatial OS Map & Geofencing:** Interactive Leaflet-powered maps featuring Vector, Satellite, and Hybrid tactical views, automatic high-accuracy GPS positioning on mount, category-based geofence radii, and "When I Reach" natural language reminders.

---

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLModel, SQLite with WAL mode, Alembic, APScheduler.
- **Frontend:** React, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React.
- **CLI:** Thin Python HTTP client for terminal workflows.
- **Infrastructure:** Ubuntu Server 24.04, Nginx, systemd, `uv`.

---

## Installation

### One-Click Setup on Ubuntu 24.04 / Debian

Move the codebase to the server, then run:

```bash
sudo chmod +x setup.sh
sudo ./setup.sh
```

The setup script installs dependencies, prepares the backend, runs migrations, builds the frontend, configures Nginx, and creates the systemd service.

### Production Updates

Use the update script for production maintenance:

```bash
sudo chmod +x update.sh
sudo ./update.sh
```

The update script refreshes the deployment, reapplies permissions, restarts the backend and Nginx, and removes temporary artifacts.

---

## CLI Usage

From the project root:

```bash
./nari.sh tell "Just finished a deep focus block"
./nari.sh digest   # Manually trigger digestion of raw context logs (normally runs automatically in background)
./nari.sh add "Finish research" --priority high
./nari.sh today
./nari.sh study-start <subject_id> --goal "Physics revision"
./nari.sh activity --limit 10
```

Windows shims are available as `nari.ps1` and `nari.bat`.

---

## Security and Privacy

- **Local-first:** Data stays on the user's server.
- **API key auth:** Clients use a configured NARI API key.
- **CORS controls:** Frontend/backend communication is restricted through configured origins.
- **PII-aware logging:** Sensitive values should be masked before entering logs.
- **Filesystem permissions:** Deployment scripts enforce production permissions for directories, files, and executable scripts.

---

## Roadmap

### Phase 1: Foundation

- [x] Stage 0: Backend core, health checks, ActivityLog.
- [x] Stage 1: CLI task management.
- [x] Stage 2: Subjects and study tracking.
- [x] Stage 3: Versioned notes.
- [x] Stage 4: Web dashboard.

### Phase 2: Intelligence

- [x] Stage 5: WebSocket real-time sync.
- [x] Stage 6: Scheduler and browser reminders.
- [x] Stage 7: Goals and habits.
- [x] Stage 8: Behavioral Analytics HUD.
- [x] Stage 8.5: PWA, offline cache, IndexedDB persistence, and background sync.
- [x] Stage 8.7: Context Stream with archive page, search, filters, and enhanced suggestions.
- [x] Stage 9: AI Co-pilot Integration (NVIDIA NIM cloud inference with local semantic memory).
- [x] Stage 9.5: Spatial OS Map & Geofencing (Phases 1-5 with adaptive polling battery optimization and geofence reminders).

### Phase 3: Expansion

- [ ] Plugin system.
- [ ] Calendar and desktop integrations.
- [ ] Voice input and output.
- [ ] Multi-device sync orchestration.

---

## License

Private and personal use only.

Developed by **Ankit Upadhyay**.
