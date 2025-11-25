from modules import utils

class NotesManager:
    def __init__(self):
        self.notes_file = "data/notes.json"

    def get_all_notes(self):
        notes = utils.load_json(self.notes_file) or {}
        return notes.get("notes", [])

    def get_note(self, note_id):
        notes = self.get_all_notes()
        return next((n for n in notes if n.get("id") == note_id), None)

    def add_note(self, note_data):
        notes = self.get_all_notes()
        new_id = utils.next_id(notes)
        note = {
            "id": new_id,
            "title": note_data.get("title"),
            "content": note_data.get("content", ""),
            "created": utils.timestamp()
        }
        notes.append(note)
        utils.save_json(self.notes_file, {"notes": notes})
        return note

    def update_note(self, note_id, note_data):
        notes = self.get_all_notes()
        for i, note in enumerate(notes):
            if note.get("id") == note_id:
                note.update({
                    "title": note_data.get("title", note["title"]),
                    "content": note_data.get("content", note["content"]),
                    "updated": utils.timestamp()
                })
                utils.save_json(self.notes_file, {"notes": notes})
                return note
        return None

    def delete_note(self, note_id):
        notes = self.get_all_notes()
        new_notes = [n for n in notes if n.get("id") != note_id]
        if len(new_notes) < len(notes):
            utils.save_json(self.notes_file, {"notes": new_notes})
            return True
        return False