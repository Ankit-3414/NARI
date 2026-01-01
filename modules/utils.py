# modules/utils.py
import os
import json
from datetime import datetime
from backend.socket import socketio, NAMESPACE

# -------------------------
# Paths
# -------------------------
DATA_DIR = "data"
LOGS_DIR = os.path.join(DATA_DIR, "logs")
SUBJECTS_FILE = os.path.join(DATA_DIR, "subjects.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")
NOTES_FILE = os.path.join(DATA_DIR, "notes.json")
ACTIVITY_LOG_FILE = os.path.join(DATA_DIR, "activity_log.json")

def next_id(items):
    """Return next numeric ID for a list of dicts with 'id' keys."""
    if not items:
        return 1
    return max(int(item.get("id", 0)) for item in items) + 1


def timestamp():
    """Return current timestamp as a string in YYYY-MM-DD HH:MM:SS format."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# -------------------------
# Directory & File Setup
# -------------------------
def ensure_directory(path):
    """Create directory if it doesn't exist."""
    os.makedirs(path, exist_ok=True)

def ensure_directories_and_files():
    """Create necessary directories and empty JSON files if they don't exist."""
    os.makedirs(LOGS_DIR, exist_ok=True)

    files_with_defaults = [
        (SUBJECTS_FILE, {}),
        (TASKS_FILE, {}),
        (NOTES_FILE, {}),
        (ACTIVITY_LOG_FILE, {"activity": []}),
    ]

    os.makedirs(os.path.join(DATA_DIR, "backups"), exist_ok=True)
    os.makedirs(os.path.join(DATA_DIR, "core"), exist_ok=True)

    for path, default in files_with_defaults:
        if not os.path.exists(path):
            with open(path, "w") as f:
                json.dump(default, f, indent=2)

def pretty_print_list(title, items):
    """Pretty print a list of tasks or items with basic formatting."""
    print(f"\n=== {title} ===")
    if not items:
        print("No items found.")
        return
    for item in items:
        status = item.get("status", "pending")
        task_id = item.get("id", "?")
        t_title = item.get("title", "")
        priority = item.get("priority", "normal")
        due = item.get("due", "N/A")
        print(f"[{task_id}] {t_title} (Priority: {priority}, Due: {due}, Status: {status})")
    print("=================\n")


# -------------------------
# JSON Helpers
# -------------------------
def load_json(path):
    """Load JSON data from file safely."""
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        append_log("file_errors.log", f"FileNotFoundError: {path}")
        return {}
    except json.JSONDecodeError as e:
        append_log("file_errors.log", f"JSONDecodeError in {path}: {e}")
        return {}
    except Exception as e:
        append_log("file_errors.log", f"Unexpected error loading {path}: {e}")
        return {}

def save_json(path, data):
    """Save JSON data to file safely."""
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)

    tmp_path = f"{path}.tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_path, path)
    except Exception as e:
        append_log("file_errors.log", f"Error saving {path}: {e}")
        # Fallback to non-atomic write if atomic fails, but log the error
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as fallback_e:
            append_log("file_errors.log", f"Fallback write failed for {path}: {fallback_e}")

# -------------------------
# Timestamp Helper
# -------------------------
def current_timestamp():
    """Return a string timestamp."""
    # kept for backward compatibility
    return timestamp()

# -------------------------
# Logging Helper
# -------------------------
def append_log(filename, message):
    """Append a timestamped message to a log file in logs directory."""
    ensure_directories_and_files()
    path = os.path.join(LOGS_DIR, filename)
    timestamp = current_timestamp()
    with open(path, "a") as f:
        f.write(f"[{timestamp}] {message}\n")

# -------------------------
# Activity Log Helper
# -------------------------
def log_user_activity(text):
    """Log user activity to file and emit socket event."""
    try:
        entry = {
            "text": text,
            "time": timestamp()
        }
        
        # Load existing
        data = load_json(ACTIVITY_LOG_FILE) or {}
        logs = data.get("activity", [])
        
        # Append new entry
        logs.append(entry)
        
        # Limit log size to last 1000 entries
        if len(logs) > 1000:
            logs = logs[-1000:]
            
        save_json(ACTIVITY_LOG_FILE, {"activity": logs})
        
        # Emit
        socketio.emit("activity_logged", entry, namespace=NAMESPACE)
    except Exception as e:
        print(f"ERROR in log_user_activity: {e}")
        append_log("file_errors.log", f"Error in log_user_activity: {e}")

def get_activity_log():
    """Retrieve activity log."""
    try:
        data = load_json(ACTIVITY_LOG_FILE) or {}
        logs = data.get("activity", [])
        return logs[::-1]
    except Exception as e:
        print(f"ERROR in get_activity_log: {e}")
        return []

