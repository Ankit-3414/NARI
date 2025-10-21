# modules/utils.py
import json
import os
import threading
from datetime import datetime

LOCK = threading.Lock()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # path to project root/NARI/modules/..
DATA_DIR = os.path.join(BASE_DIR, "data")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
SUBJECTS_FILE = os.path.join(DATA_DIR, "subjects.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")
NOTES_FILE = os.path.join(DATA_DIR, "notes.json")
MASTER_LOG = os.path.join(LOGS_DIR, "master.json")

DEFAULT_FILES = {
    SUBJECTS_FILE: {"subjects": []},
    TASKS_FILE: {"tasks": []},
    NOTES_FILE: {"notes": []},
    MASTER_LOG: {"logs": []},
}

def timestamp(fmt="%Y-%m-%d %H:%M:%S"):
    return datetime.now().strftime(fmt)

def ensure_directories_and_files():
    """Create data directories and files if they do not exist."""
    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)  # safe even if exists

    # Ensure each default file exists with sensible default structure
    for path, default_content in DEFAULT_FILES.items():
        if not os.path.exists(path):
            save_json(path, default_content)

def load_json(path):
    """Thread-safe JSON read. Returns data or default when missing/corrupt."""
    ensure_directories_and_files()
    try:
        with LOCK:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Repair with default if available
        default = DEFAULT_FILES.get(path, {})
        save_json(path, default)
        return default

def save_json(path, data):
    """Thread-safe JSON write (atomic-ish)."""
    ensure_directories_and_files()
    tmp = path + ".tmp"
    with LOCK:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)

def next_id(items, id_field="id"):
    """Return next integer id for a list of dicts with id_field; starts at 1."""
    if not items:
        return 1
    max_id = 0
    for it in items:
        try:
            if int(it.get(id_field, 0)) > max_id:
                max_id = int(it.get(id_field, 0))
        except Exception:
            continue
    return max_id + 1

def pretty_print_list(title, rows, show_count=True):
    print(f"\n=== {title} ===")
    if not rows:
        print("  (none)\n")
        return
    for r in rows:
        print(" -", end=" ")
        # r may be dict or string
        if isinstance(r, dict):
            # try common fields
            parts = []
            if "id" in r:
                parts.append(f"[{r['id']}]")
            if "title" in r:
                parts.append(str(r["title"]))
            elif "content" in r:
                parts.append(str(r["content"]))
            if "priority" in r:
                parts.append(f"(prio: {r['priority']})")
            if "due" in r and r["due"]:
                parts.append(f"(due: {r['due']})")
            if "status" in r:
                parts.append(f"- {r['status']}")
            if "created" in r:
                parts.append(f"@{r['created']}")
            print(" ".join(parts))
        else:
            print(str(r))
    if show_count:
        print(f"\nTotal: {len(rows)}\n")
