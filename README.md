# 🌌 NARI (Not A Random Intelligence)

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?style=for-the-badge)](https://github.com/Ankit-3414/NARI)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)](https://github.com/Ankit-3414/NARI)
[![Platform](https://img.shields.io/badge/Platform-Self--Hosted-purple.svg?style=for-the-badge)](https://github.com/Ankit-3414/NARI)

**NARI** is a local-first, privacy-centric "Personal Operating System" designed to centralize your productivity, study habits, and behavioral analytics. It's built for those who want a high-fidelity dashboard for their life without sacrificing their data to the cloud.

> "AI-ready but AI-deferred. Every action is a data point for your future local intelligence."

---

## ✨ Core Pillars

### 📋 Task Architecture
Beyond simple to-dos. NARI features a priority-driven inbox, automated "Today" view, and deep history tracking for every task transaction.

### 📚 Focus Engine
Integrated study session tracking with interruption logging, subject-specific focus time, and real-time session management.

### 🧠 Behavioral Analytics
Live data visualization of your productivity trends. Monitor task completion rates, study streaks, and habit consistency through a premium glassmorphism interface.

### 🛡️ System Audit Vault
A real-time, append-only memory stream of every database transaction. Complete transparency into how your data is being managed and updated.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.12 + FastAPI + SQLModel (SQLAlchemy + Pydantic)
- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion + Lucide Icons
- **Database:** SQLite (WAL Mode) for local-first speed and reliability
- **State Management:** Zustand (UI) & React Query (Server State)
- **Automation:** APScheduler for intelligent reminder polling

---

## 🗺️ Roadmap & Timeline

| Phase | Milestone | Status |
| :--- | :--- | :--- |
| **Stage 0-4** | Core Infrastructure, Backend API, CLI & Web Dashboard | ✅ |
| **Stage 5** | WebSocket Integration & Live Updates | ✅ |
| **Stage 7-8** | Goals, Habits & Behavioral Analytics | ✅ |
| **Stage 9** | **AI Layer Activation (Ollama/Groq Integration)** | ⏳ *Coming Soon* |
| **Stage 10** | Mobile Native Wrapper (PWA/Capacitor) | 📅 *Planned* |

---

## 🚀 Installation & Setup

### 📋 Prerequisites
- Python 3.12+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### 🔧 Backend Setup
```bash
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e .
alembic upgrade head
python run.py
```

### 💻 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 🛠️ CLI Usage
Access NARI from your terminal:
```powershell
./nari.ps1 task list
./nari.ps1 habit complete 1
```

---

## 🎨 Design Philosophy
NARI utilizes a **Deep Dark Glassmorphism** theme (`#0D0D0D`) with backdrop blur effects and high-fidelity spring animations. Every interaction is designed to feel tactile, responsive, and professional.

---

## 🔐 Security
NARI is designed to be self-hosted. It uses Master API Key authentication to ensure that only you can access your Personal OS. Your data stays on your machine, always.

---

## 📄 License
**Proprietary / All Rights Reserved**.  
This project is private and intended for personal use only. No permission is granted to copy, distribute, or modify the code for public or commercial use.

---

*Built with ❤️ by [Ankit Upadhyay](https://github.com/Ankit-3414)*
