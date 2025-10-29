# modules/notes.py
import argparse
import os
from modules import utils

NOTES_FILE = utils.NOTES_FILE
NOTES_DIR = os.path.dirname(NOTES_FILE)

def _load_notes():
    data = utils.load_json(NOTES_FILE)
    return data.get("notes", [])

def _save_notes(notes):
    data = {"notes": notes}
    utils.save_json(NOTES_FILE, data)

def add_note(argv):
    """add-note "title" """
    parser = argparse.ArgumentParser(prog="add-note", add_help=False)
    parser.add_argument("title", nargs=1)
    try:
        args = parser.parse_args(argv)
    except SystemExit:
        print('Usage: add-note "title"')
        return

    title = args.title[0]
    notes = _load_notes()
    new_id = utils.next_id(notes)
    note = {
        "id": new_id,
        "title": title,
        "content": "",
        "created": utils.timestamp()
    }
    notes.append(note)
    _save_notes(notes)
    print(f'Note added: [{new_id}] "{title}"')

def list_notes(argv=None):
    notes = _load_notes()
    if not notes:
        print("No notes found.")
        return
    print("📓 Notes List:\n")
    for note in notes:
        preview = note.get("content", "")[:50].replace("\n", " ")
        print(f"[{note['id']}] {note['title']} (Created: {note['created']})")
        print(f"    {preview}...\n")

def view_note(argv):
    if not argv:
        print("Usage: view-note <id>")
        return
    try:
        id_ = int(argv[0])
    except ValueError:
        print("Invalid id. Use integer.")
        return

    notes = _load_notes()
    note = next((n for n in notes if int(n.get("id", -1)) == id_), None)
    if not note:
        print(f"No note with id {id_}")
        return

    print(f"Title: {note['title']}")
    print(f"Created: {note['created']}")
    print("\nContent:\n")
    print(note.get("content", ""))

def open_note(argv):
    """Open note in terminal editor (nano by default)"""
    if not argv:
        print("Usage: open-note <id>")
        return
    try:
        id_ = int(argv[0])
    except ValueError:
        print("Invalid id. Use integer.")
        return

    notes = _load_notes()
    note = next((n for n in notes if int(n.get("id", -1)) == id_), None)
    if not note:
        print(f"No note with id {id_}")
        return

    # ensure notes folder exists
    os.makedirs(NOTES_DIR, exist_ok=True)
    note_path = os.path.join(NOTES_DIR, f"{id_}.txt")

    # write current content if file doesn't exist
    if not os.path.exists(note_path):
        with open(note_path, "w") as f:
            f.write(note.get("content", ""))

    # open editor (prefer $EDITOR, on Windows fallback to notepad, otherwise nano)
    editor = os.environ.get("EDITOR") or ("notepad" if os.name == "nt" else "nano")
    # Use system call — keep simple cross-platform behavior
    os.system(f"{editor} {note_path}")

    # read back updated content
    with open(note_path, "r") as f:
        note["content"] = f.read()
    # save updated content back to notes.json
    _save_notes(notes)
    print(f"Note {id_} updated.")

def delete_note(argv):
    if not argv:
        print("Usage: delete-note <id>")
        return
    try:
        id_ = int(argv[0])
    except ValueError:
        print("Invalid id. Use integer.")
        return

    notes = _load_notes()
    new_notes = [n for n in notes if int(n.get("id", -1)) != id_]
    if len(new_notes) == len(notes):
        print(f"No note with id {id_}")
        return

    # remove any associated text file
    note_path = os.path.join(NOTES_DIR, f"{id_}.txt")
    try:
        if os.path.exists(note_path):
            os.remove(note_path)
    except Exception:
        # non-fatal: continue even if file removal fails
        pass

    _save_notes(new_notes)
    print(f"Note {id_} deleted.")

