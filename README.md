# NARI – Not A Random Intelligence (v0.3)

👋 Welcome to **NARI**, your personal intelligent study assistant!

NARI has evolved from a simple CLI tool into a comprehensive study companion with a robust backend and a beautiful, real-time web dashboard. It helps you track study sessions, manage tasks, set smart alarms, and automate your workflow.

---

## 🚀 Features

### 🖥️ Web Dashboard (New in v0.3)
- **Real-time Clock & Alarms:** Set alarms, stopwatches, and timers.
- **Study Tracking:** Visualize your study sessions and subject progress.
- **Task Management:** Add, edit, and complete tasks.
- **Automation:** (Coming Soon) Automate routine tasks.
- **Responsive Design:** A modern, dark-themed UI built with React and Tailwind CSS.

### 💻 CLI Assistant
- **Quick Commands:** Manage subjects and sessions directly from the terminal.
- **Session Logging:** Detailed logs of all your study activity.
- **Reports:** Generate daily and master reports of your progress.

---

## 🛠️ Tech Stack
- **Backend:** Python, Flask, Flask-SocketIO, Eventlet
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Communication:** WebSocket (Socket.IO) for real-time updates

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js & npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Ankit-3414/NARI.git
cd NARI
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 🏃‍♂️ Running NARI

### 1. Start the Backend Server
To use the web dashboard, you must run NARI in server mode:
```bash
# From the root directory
python nari.py --server
```
The server will start on `http://0.0.0.0:5000`.

### 2. Build & Run Frontend
**Development Mode:**
```bash
cd frontend
npm run dev
```

**Production Build:**
```bash
cd frontend
npm run build
```
The built files will be in `frontend/dist`. You can serve these using Nginx or any static file server.

---

## ⚙️ Configuration (Important for VMs/Hosting)

If you are hosting the backend on a different machine (e.g., a VirtualBox VM) than the one accessing the frontend, you **must** configure the backend IP address.

1.  Open `frontend/src/config.js`.
2.  Update the `API_BASE_URL` to match your backend's IP:
    ```javascript
    export const API_BASE_URL = 'http://192.168.1.240:5000'; // Example IP
    ```
3.  Rebuild the frontend (`npm run build`) after changing the config.

---
## 🔮 Vision
NARI is built with a long-term vision to become a fully autonomous, highly intelligent personal assistant that integrates seamlessly into every aspect of productivity and life management.

---

## 👤 Author
**Ankit Upadhyay**
*This is a personal project built with passion and a long-term vision.*
