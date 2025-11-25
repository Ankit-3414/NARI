# NARI – Not A Random Intelligence

👋 Welcome to **NARI**, your personal CLI study assistant!  
This is the second iteration (v0.22) of NARI, designed to help you **track your study sessions**, manage subjects, and view your progress over time.

---

## Features (v0.1)

- **Dynamic Greetings:** NARI greets you with a different welcome message each time.  
- **Subject Management:**  
  - `add <subject>` → Add a new subject  
  - `remove <subject>` → Remove a subject  
  - `list` → List all registered subjects  
- **Study Sessions:**  
  - `start <subject>` → Start a real-time stopwatch for a subject  
  - `stop` → Stop the current session (optionally save)  
- **Logging:**  
  - **Daily logs** stored in `data/logs/YYYY-MM-DD.json`  
  - **Master log** stored in `data/logs/master.json` with all sessions  
- **Reports:**  
  - `report [YYYY-MM-DD]` → View study sessions for a specific day  
  - `master_report [subject]` → View all sessions across all days (optionally filter by subject)  
- **Help Command:**  
  - `help` → Lists all available commands  
- **Cross-Platform:** Works on **Linux** and **Windows**  

---

## Installation

1. Clone the repository:  
   ```bash
   git clone https://github.com/Ankit-3414/NARI.git
   cd NARI
python -m venv venv

source venv/bin/activate  
