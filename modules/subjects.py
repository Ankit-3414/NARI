# modules/subjects.py
import os
import json

SUBJECTS_FILE = os.path.join("data", "subjects.json")
os.makedirs(os.path.dirname(SUBJECTS_FILE), exist_ok=True)

def load_subjects():
    if os.path.exists(SUBJECTS_FILE):
        try:
            with open(SUBJECTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f).get("subjects", [])
        except Exception:
            # corrupted or empty file — return empty list
            return []
    return []

def save_subjects(subjects):
    with open(SUBJECTS_FILE, "w", encoding="utf-8") as f:
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

def handle_command(args):
    """args: list like ['add', 'Mathematics'] or ['list']"""
    if not args:
        print("Usage: subjects add|remove|list")
        return
    cmd = args[0].lower()
    rest = args[1:]
    if cmd == "add" and rest:
        add_subject(" ".join(rest))
    elif cmd == "remove" and rest:
        remove_subject(" ".join(rest))
    elif cmd == "list":
        list_subjects()
    else:
        print("Usage: subjects add|remove|list")
