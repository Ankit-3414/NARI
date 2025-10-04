# modules/study.py
import os
import json
import time
from datetime import datetime

LOGS_DIR = os.path.join("data", "logs")
MASTER_LOG_FILE = os.path.join(LOGS_DIR, "master.json")
os.makedirs(LOGS_DIR, exist_ok=True)

current_session = {"subject": None, "start_time": None}

def save_session(subject, start_time, end_time):
    date_str = start_time.strftime("%Y-%m-%d")
    log_file = os.path.join(LOGS_DIR, f"{date_str}.json")

    # load or init daily log
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception:
                data = {"date": date_str, "sessions": [], "total_time_minutes": 0}
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
    data["total_time_minutes"] = data.get("total_time_minutes", 0) + elapsed_minutes

    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    # master log
    if os.path.exists(MASTER_LOG_FILE):
        with open(MASTER_LOG_FILE, "r", encoding="utf-8") as f:
            try:
                master_data = json.load(f)
            except Exception:
                master_data = {"sessions": []}
    else:
        master_data = {"sessions": []}

    session_data_with_date = {"date": date_str, **session_data}
    master_data["sessions"].append(session_data_with_date)

    with open(MASTER_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(master_data, f, indent=4)

    print(f"\n✅ Session for '{subject}' ended. Time logged: {elapsed_minutes} minutes.")

def start_session(subject, subjects_loader):
    """
    subject: string
    subjects_loader: function that returns list of subjects (pass modules.subjects.load_subjects)
    This call is blocking and shows realtime elapsed time (same behavior as original).
    """
    global current_session
    subjects = subjects_loader()
    if subject not in subjects:
        print(f"⚠ Subject '{subject}' not registered. Add it first.")
        return
    if current_session["subject"]:
        print(f"⚠ You are already studying '{current_session['subject']}'. Stop it first.")
        return

    current_session["subject"] = subject
    current_session["start_time"] = datetime.now()
    print(f"⏳ Started session for '{subject}' at {current_session['start_time'].strftime('%H:%M')}")

    try:
        while True:
            elapsed = datetime.now() - current_session["start_time"]
            minutes, seconds = divmod(int(elapsed.total_seconds()), 60)
            print(f"\r⏱️  Elapsed time: {minutes:02d}:{seconds:02d}", end="", flush=True)
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

def report(date_str=None):
    """Show sessions for a given date (YYYY-MM-DD). Defaults to today."""
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    log_file = os.path.join(LOGS_DIR, f"{date_str}.json")

    if not os.path.exists(log_file):
        print(f"⚠ No sessions found for {date_str}.")
        return

    with open(log_file, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception:
            print(f"⚠ Could not read log for {date_str}.")
            return

    print(f"\n📊 Study Report for {date_str}:")
    print(f"Total time: {data.get('total_time_minutes', 0)} minutes")
    print("-" * 30)
    for s in data.get("sessions", []):
        print(f"{s['subject']}: {s['start_time']} - {s['end_time']} ({s['elapsed_minutes']} min)")
    print("-" * 30)

def master_report(subject_filter=None):
    if not os.path.exists(MASTER_LOG_FILE):
        print("⚠ No master log found yet.")
        return

    with open(MASTER_LOG_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception:
            print("⚠ Could not read master log.")
            return

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

def handle_command(args, subjects_loader):
    """
    args: list like ['start','Mathematics'] or ['report','2025-10-03']
    subjects_loader: function so this module doesn't import subjects directly
    """
    if not args:
        print("Usage: study start|stop|pause|resume|report")
        return
    cmd = args[0].lower()
    rest = args[1:]
    if cmd == "start" and rest:
        start_session(" ".join(rest), subjects_loader)
    elif cmd == "stop":
        stop_session(save=True)
    elif cmd == "report":
        report(rest[0] if rest else None)
    elif cmd == "master_report":
        master_report(rest[0] if rest else None)
    else:
        print("Usage: study start|stop|report|master_report")
