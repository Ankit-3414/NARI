# modules/notes.py
from modules import utils

NOTES_FILE = utils.NOTES_FILE

def _load_notes():
    data = utils.load_json(NOTES_FILE)
    return data.get("notes", [])

def _save_notes(notes):
    data = {"notes": notes}
    utils.save_json(NOTES_FILE, data)

def add_note(argv):
    """add-note "text" """
    if not argv:
        print('Usage: add-note "note text"')
        return
    content = " ".join(argv).strip().strip('"').strip("'")
    notes = _load_notes()
    new_id = utils.next_id(notes)
    note = {
        "id": new_id,
        "content": content,
        "created": utils.timestamp()
    }
    notes.append(note)
    _save_notes(notes)
    print(f"Note added: [{new_id}] {content[:50]}")

def list_notes(argv=None):
    notes = _load_notes()
    utils.pretty_print_list("Notes", notes)

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
    _save_notes(new_notes)
    print(f"Note {id_} deleted.")
