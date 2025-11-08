# modules/utils.py
import os
import json
from datetime import datetime

# -------------------------
# Paths
# -------------------------
DATA_DIR = "data"
LOGS_DIR = os.path.join(DATA_DIR, "logs")
SUBJECTS_FILE = os.path.join(DATA_DIR, "subjects.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")
NOTES_FILE = os.path.join(DATA_DIR, "notes.json")

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
    ]

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
    with open(path, "r") as f:
        return json.load(f)

def save_json(path, data):
    """Save JSON data to file safely."""
    # ensure parent directory exists
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)

    # write atomically: write to temp file then replace
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w") as f:
        json.dump(data, f, indent=2)
    try:
        os.replace(tmp_path, path)
    except Exception:
        # fallback to non-atomic write
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

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
