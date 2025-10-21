# modules/utils.py
import os
import json
from datetime import datetime
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
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

# -------------------------
# Timestamp Helper
# -------------------------
def current_timestamp():
    """Return a string timestamp."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
