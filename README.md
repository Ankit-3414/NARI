# NARI (Not A Random Intelligence)

**NARI** is a Sovereign Personal AGI in its foundational evolutionary architecture. Operating with calm, continuous presence and absolute privacy on dedicated infrastructure, NARI unifies cognitive memory, environmental telemetry, spatial awareness, and autonomous execution into a single, cohesive command intelligence for one user.

> **Philosophy:** Cognitive Grounding from Day Zero. Every meaningful behavioral stream and action is recorded into a persistent cognitive substrate so NARI's reasoning models evolve from authentic historical context rather than hollow prompts.

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
- **Web Research & Reasoning Engine:** Keyless, container-free online intelligence (DuckDuckGo + Jina Reader + LLaMA 3.1) capable of fetching live articles, documentation, or news and synthesizing reasoned conclusions with verified source links.
- **Spatial Awareness & Geofencing:** Interactive Leaflet-powered tactical views (Vector, Satellite, Hybrid), automatic high-accuracy GPS positioning on mount, category-based geofence radii, and "When I Reach" natural language directives.

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

### Secure Remote Access & Web Push (CGNAT Bypass)

If your home internet is behind Carrier-Grade NAT (CGNAT) and standard port-forwarding fails, you can expose NARI securely via HTTPS for free using **ngrok**:

1. Install ngrok via snap and configure your authtoken:
   ```bash
   sudo snap install ngrok
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
2. Enable the tunnel 24/7 as a background service:
   Set up `/etc/systemd/system/ngrok.service` to run:
   `ngrok http 80 --domain=your-subdomain.ngrok-free.dev`
3. Add your ngrok URL to `NARI_ALLOWED_ORIGINS` in `backend/.env` and restart NARI.
4. Open the ngrok link in your browser to access NARI securely and enable native Web Push alerts!

For detailed configuration instructions, see [docs/DEPLOY.md](file:///H:/NARI/docs/DEPLOY.md#7-bypassing-cgnat-and-exposing-securely-ngrok).

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
- [x] Stage 9.5: Spatial Awareness & Geofencing (Adaptive polling battery optimization and geofence directives).

### Phase 3: Expansion

- [ ] Plugin system.
- [ ] Calendar and desktop integrations.
- [ ] Voice input and output.
- [ ] Multi-device sync orchestration.

---

## License

Private and personal use only.

Developed by **Ankit Upadhyay**.
