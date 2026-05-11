# 🌌 NARI (Not A Random Intelligence)

**NARI** is a local-first, self-hosted personal productivity platform designed to be your private "Personal Operating System." It integrates task management, study tracking, notes, goals, habits, and behavioral analytics into a single, cohesive intelligence layer.

> **Philosophy:** AI-ready but AI-deferred. NARI logs every meaningful action to build a rich behavioral dataset, preparing for local AI integration (Stage 9) while remaining fully functional without it.

---

## 🚀 Key Features

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
Port the codebase to your server and run the master deployment engine:

```bash
sudo chmod +x setup.sh
sudo ./setup.sh
```

**This script automates:**
1.  System dependency installation (Python, Node, Nginx, SQLite).
2.  Python environment isolation using `uv`.
3.  Database initialization and schema migrations.
4.  Production frontend compilation.
5.  Nginx reverse proxy configuration for static IP `192.168.1.100`.
6.  Systemd service creation for 24/7 "Background Pulse."

---

## ⌨️ CLI Usage

NARI includes a powerful CLI for terminal-based control:

*   **Add Task:** `./nari.sh add "Finish Research" --priority high`
*   **Today's View:** `./nari.sh today`
*   **Study Start:** `./nari.sh study-start <subject_id> --goal "Neural Calibration"`
*   **Activity Log:** `./nari.sh activity --limit 10`

---

## 🛰 API Response Contract

All API responses follow a strict high-fidelity contract:

```json
{
  "ok": true,
  "data": { ... },
  "error": null
}
```

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
*   [x] **Stage 8:** Behavioral Analytics HUD.
*   [ ] **Stage 9:** **AI Layer (Ollama + Llama 3.1 8B Integration)** - *Next Objective*

### **Phase 3: Expansion (v1.1.0+) - FUTURE**
*   [ ] Plugin system for community extensions.
*   [ ] Advanced Desktop Management & Voice Input.
*   [ ] Multi-device sync orchestration.

---

## 🛡 Security & Privacy

*   **100% Local:** Your data never leaves your server. No cloud dependencies.
*   **PII Redaction:** Sensitive data is proactively masked in logs to ensure privacy-safe behavioral history.
*   **Neural Handshake:** All client-server communication requires a valid API Key/Token handshake.

---

## 📄 License
Private & Personal Use only.
Developed by **Ankit Upadhyay**.
