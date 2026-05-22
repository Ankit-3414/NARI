# 🌌 NARI (Not A Random Intelligence)

**NARI** is a local-first, self-hosted personal productivity platform designed to be your private "Personal Operating System." It integrates task management, study tracking, notes, goals, habits, and behavioral analytics into a single, cohesive intelligence layer.

> **Philosophy:** AI-ready but AI-deferred. NARI logs every meaningful action to build a rich behavioral dataset, preparing for local AI integration (Stage 9) while remaining fully functional without it.

---

## 🚀 Key Features

*   **Pre-Flight Intercept:** Proactive real-time signal monitoring that detects upcoming tasks and reminders before they trigger.
*   **Ghost Protocol:** Automated resolution engine that handles "ghosted" or missed signals by auto-completing or rescheduling them based on behavioral rules.
*   **Task Intelligence:** Advanced task management with history tracking, priorities, and smart "Today" views.
*   **Study Core:** Deep focus timer with subject-specific tracking, interruption logging, and session analytics.
*   **Neural Notes:** Markdown-based note-taking with automatic version history and full-text search.
*   **Vision Tracking:** Integrated Goals and Habits with streak management and progress HUDs.
*   **Behavioral HUD:** Real-time analytics engine that visualizes your productivity patterns.
*   **Neural Link:** Standardized API-first architecture with WebSocket-driven real-time UI updates.

---

## 🛠 Tech Stack

*   **Backend:** Python 3.12, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite (WAL Mode).
*   **Frontend:** React (Vite), Tailwind CSS, TanStack Query, Zustand, Lucide Icons.
*   **CLI:** Thin Python HTTP client for power-user interaction.
*   **Infrastructure:** Nginx (Reverse Proxy), Systemd (Service management), `uv` (Fast dependency management).

---

## 📦 Installation & Deployment

### One-Click Setup (Ubuntu 24.04 / Debian)
Port the codebase to your server and run the master setup engine:

```bash
sudo chmod +x setup.sh
sudo ./setup.sh
```

### Neural Upgrade Engine (Production Maintenance)
To update NARI on your production server with absolute reliability, use the **Neural Upgrade Engine**:

```bash
sudo chmod +x update.sh
./update.sh
```

**The upgrade engine automates:**
1.  **Defensive Pathing:** Dynamic project root detection for path-immune execution.
2.  **Robust Permission Protocol:** Automated 755/644 permission calibration + executable binary authorization.
3.  **Neural Pulse:** Atomic restart of NARI backend and Nginx reverse proxy.
4.  **Tactical Purge:** Automated cleanup of temporary debug and test artifacts.

---

## ⌨️ CLI Usage

NARI includes a powerful CLI for terminal-based control:

*   **Log Context:** `./nari.sh tell "Just finished a deep focus block"`
*   **Add Task:** `./nari.sh add "Finish Research" --priority high`
*   **Today's View:** `./nari.sh today`
*   **Study Start:** `./nari.sh study-start <subject_id> --goal "Neural Calibration"`
*   **Activity Log:** `./nari.sh activity --limit 10`

---

## 🛡 Security & Privacy

*   **100% Local:** Your data never leaves your server. No cloud dependencies.
*   **Neural Handshake:** Hardened client-server communication with token masking (`neura***`) and strict CORS lockdown.
*   **PII Redaction:** Sensitive data is proactively masked in logs to ensure privacy-safe behavioral history.
*   **Robust Permissions:** Strict filesystem lockdowns (Folders: 755 / Files: 644) managed by the deployment engine.

---

## 🗺 Roadmap & Version History

### **Phase 1: Foundation (v0.1.0 - v0.5.0) - DONE**
*   [x] **Stage 0:** Neural Core, ActivityLog, and Health monitoring.
*   [x] **Stage 1:** CLI Task Management.
*   [x] **Stage 2:** Subjects & Study tracking.
*   [x] **Stage 3:** Versioned Neural Notes.
*   [x] **Stage 4:** Mobile-first Web Dashboard.

### **Phase 2: Intelligence (v0.6.0 - v1.0.0) - CURRENT**
*   [x] **Stage 5:** WebSocket Real-time Sync.
*   [x] **Stage 6:** Scheduler & Browser Reminders.
*   [x] **Stage 7:** Vision layer (Goals & Habits).
*   [x] **Stage 8:** Behavioral Analytics HUD (HUD v1.0).
*   [x] **v1.0.0-alpha.7:** Neural Upgrade Engine & Ghost Protocol.
*   [ ] **Stage 9:** **AI Layer (Ollama + Llama 3.1 8B Integration)** - *Next Objective*

### **Phase 3: Expansion (v1.1.0+) - FUTURE**
*   [ ] Plugin system for community extensions.
*   [ ] Advanced Desktop Management & Voice Input.
*   [ ] Multi-device sync orchestration.

---

## 📄 License
Private & Personal Use only.
Developed by **Ankit Upadhyay**.
