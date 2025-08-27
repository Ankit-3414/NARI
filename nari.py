import os
import json
import time
import random
from datetime import datetime

# -------------------------
# File Paths
# -------------------------
SUBJECTS_FILE = os.path.join("data", "subjects.json")
LOGS_DIR = os.path.join("data", "logs")
MASTER_LOG_FILE = os.path.join(LOGS_DIR, "master.json")
os.makedirs(LOGS_DIR, exist_ok=True)

# -------------------------
# Dynamic Greeting
# -------------------------
def greet():
    greetings = [
        "Hey! Ready to study?",
        "👋 Welcome back!",
        "Let's get productive!",
        "Time to focus! 🚀",
        "Hello! What shall we tackle today?"
    ]
    print(random.choice(greetings))

# -------------------------
# Subjects Handling
# -------------------------
def load_subjects():
    if os.path.exists(SUBJECTS_FILE):
        with open(SUBJECTS_FILE, "r") as f:
            return json.load(f).get("subjects", [])
    return []

def save_subjects(subjects):
    with open(SUBJECTS_FILE, "w") as f:
        json.dump({"subjects": subjects}, f, indent=4)

def add_subject(subject):
    subjects = load_subjects()
    if subject in subjects:
        print(f"⚠ Subject '{subject}' already exists.")
    else:
        subjects.append(subject)
        save_subjects(subjects)
        print(f"✅ Subject '{subject}' added.")

def remove_subject(subject):
    subjects = load_subjects()
    if subject in subjects:
        subjects.remove(subject)
        save_subjects(subjects)
        print(f"❌ Subject '{subject}' removed.")
    else:
        print(f"⚠ Subject '{subject}' not found.")

def list_subjects():
    subjects = load_subjects()
    if subjects:
        print("📚 Registered subjects:")
        for sub in subjects:
            print(f" - {sub}")
    else:
        print("No subjects registered yet.")

# -------------------------
# Study Session Handling
# -------------------------
current_session = {"subject": None, "start_time": None}

def save_session(subject, start_time, end_time):
    date_str = start_time.strftime("%Y-%m-%d")
    log_file = os.path.join(LOGS_DIR, f"{date_str}.json")

    # -------- Daily Log --------
    if os.path.exists(log_file):
        with open(log_file, "r") as f:
            data = json.load(f)
    else:
        data = {"date": date_str, "sessions": [], "total_time_minutes": 0}

    elapsed_minutes = int((end_time - start_time).total_seconds() // 60)
    session_data = {
        "subject": subject,
        "start_time": start_time.strftime("%H:%M"),
        "end_time": end_time.strftime("%H:%M"),
        "elapsed_minutes": elapsed_minutes
    }

    data["sessions"].append(session_data)
    data["total_time_minutes"] += elapsed_minutes

    with open(log_file, "w") as f:
        json.dump(data, f, indent=4)

    # -------- Master Log --------
    if os.path.exists(MASTER_LOG_FILE):
        with open(MASTER_LOG_FILE, "r") as f:
            master_data = json.load(f)
    else:
        master_data = {"sessions": []}

    # Add the session with date info
    session_data_with_date = {"date": date_str, **session_data}
    master_data["sessions"].append(session_data_with_date)

    with open(MASTER_LOG_FILE, "w") as f:
        json.dump(master_data, f, indent=4)

    print(f"\n✅ Session for '{subject}' ended. Time logged: {elapsed_minutes} minutes.")


def start_session(subject):
    global current_session
    subjects = load_subjects()
    if subject not in subjects:
        print(f"⚠ Subject '{subject}' not registered. Add it first.")
        return
    if current_session["subject"]:
        print(f"⚠ You are already studying '{current_session['subject']}'. Stop it first.")
        return

    current_session["subject"] = subject
    current_session["start_time"] = datetime.now()
    print(f"⏳ Started session for '{subject}' at {current_session['start_time'].strftime('%H:%M')}")

    # Show elapsed time in real-time
    try:
        while True:
            elapsed = datetime.now() - current_session["start_time"]
            minutes, seconds = divmod(int(elapsed.total_seconds()), 60)
            print(f"\r⏱️  Elapsed time: {minutes:02d}:{seconds:02d}", end="")
            time.sleep(1)
    except KeyboardInterrupt:
        stop_session(save=True)

def stop_session(save=False):
    global current_session
    if not current_session["subject"]:
        print("⚠ No session is currently running.")
        return
    end_time = datetime.now()
    subject = current_session["subject"]
    start_time = current_session["start_time"]
    current_session = {"subject": None, "start_time": None}

    if save:
        choice = input(f"\nDo you want to save the session for '{subject}'? (y/n): ").strip().lower()
        if choice == 'y':
            save_session(subject, start_time, end_time)
        else:
            print(f"⚠ Session for '{subject}' skipped. Not saved.")
    else:
        print(f"\n⚠ Session for '{subject}' skipped. Not saved.")

# -------------------------
# Report Command
# -------------------------
def report(date_str=None):
    """Show sessions for a given date (YYYY-MM-DD). Defaults to today."""
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    log_file = os.path.join(LOGS_DIR, f"{date_str}.json")

    if not os.path.exists(log_file):
        print(f"⚠ No sessions found for {date_str}.")
        return

    with open(log_file, "r") as f:
        data = json.load(f)

    print(f"\n📊 Study Report for {date_str}:")
    print(f"Total time: {data.get('total_time_minutes', 0)} minutes")
    print("-" * 30)
    for s in data.get("sessions", []):
        print(f"{s['subject']}: {s['start_time']} - {s['end_time']} ({s['elapsed_minutes']} min)")
    print("-" * 30)

def master_report(subject_filter=None):
    """Show all sessions in the master log, optionally filtered by subject."""
    if not os.path.exists(MASTER_LOG_FILE):
        print("⚠ No master log found yet.")
        return

    with open(MASTER_LOG_FILE, "r") as f:
        data = json.load(f)

    sessions = data.get("sessions", [])
    if subject_filter:
        sessions = [s for s in sessions if s["subject"].lower() == subject_filter.lower()]

    if not sessions:
        print("⚠ No sessions found for this filter." if subject_filter else "⚠ No sessions found yet.")
        return

    print("\n📊 Master Study Report:")
    total_time = 0
    print("-" * 40)
    for s in sessions:
        print(f"{s['date']} | {s['subject']} | {s['start_time']} - {s['end_time']} ({s['elapsed_minutes']} min)")
        total_time += s['elapsed_minutes']
    print("-" * 40)
    print(f"Total time across all sessions: {total_time} minutes")


# ------------------------
# Help Command
# ------------------------
def show_help():
    print("\n🛠️  NARI Commands:")
    print(" add <subject>       - Add a new subject")
    print(" remove <subject>    - Remove a subject")
    print(" list                - List all subjects")
    print(" start <subject>     - Start a study session for a subject")
    print(" stop                - Stop current session (prompts to save)")
    print(" report [YYYY-MM-DD] - Show daily study report (default: today)")
    print(" help                - Show this help message")
    print(" exit / quit         - Exit NARI")
    print(" master_report [subject] - Show all sessions across all days, optionally filter by subject")


# -------------------------
# Main CLI Loop
# -------------------------
def main():
    greet()
    while True:
        command = input("\n> ").strip().lower().split()
        if not command:
            continue

        cmd = command[0]
        args = command[1:]

        if cmd == "add" and args:
            add_subject(" ".join(args))
        elif cmd == "remove" and args:
            remove_subject(" ".join(args))
        elif cmd == "list":
            list_subjects()
        elif cmd == "start" and args:
            start_session(" ".join(args))
        elif cmd == "stop":
            stop_session(save=True)
        elif cmd == "report":
            report(args[0] if args else None)
        elif cmd == "help":
            show_help()
        elif cmd == "master_report":
            master_report(args[0] if args else None)
        elif cmd in ["exit", "quit", "bye", "shutup", "off"]:
            print("👋 Goodbye!")
            break
        else:
            print("❓ Unknown command. Try 'add', 'remove', 'list', 'start', 'stop', 'report', or 'exit'.")

if __name__ == "__main__":
    main()
