from flask import Blueprint, request, jsonify
from modules import utils
from backend.socket import socketio, NAMESPACE

bp = Blueprint("notes_routes", __name__)
NOTES_FILE = utils.NOTES_FILE

def _read_notes():
    data = utils.load_json(NOTES_FILE) or {}
    return data.get("notes", [])

def _write_notes(notes):
    utils.save_json(NOTES_FILE, {"notes": notes})

@bp.route("/api/notes", methods=["GET"])
def list_notes():
    return jsonify(_read_notes())

@bp.route("/api/notes", methods=["POST"])
def create_note():
    payload = request.get_json() or {}
    title = payload.get("title")
    content = payload.get("content", "")
from flask import Blueprint, request, jsonify
from modules import utils
from backend.socket import socketio, NAMESPACE

bp = Blueprint("notes_routes", __name__)
NOTES_FILE = utils.NOTES_FILE

def _read_notes():
    data = utils.load_json(NOTES_FILE) or {}
    return data.get("notes", [])

def _write_notes(notes):
    utils.save_json(NOTES_FILE, {"notes": notes})

@bp.route("/api/notes", methods=["GET"])
def list_notes():
    return jsonify(_read_notes())

@bp.route("/api/notes", methods=["POST"])
def create_note():
    payload = request.get_json() or {}
    title = payload.get("title")
    content = payload.get("content", "")
    if not title:
        return jsonify({"error": "title required"}), 400
    notes = _read_notes()
    new_id = utils.next_id(notes)
    note = {"id": new_id, "title": title, "content": content, "created": utils.timestamp()}
    notes.append(note)
    _write_notes(notes)
    socketio.emit("note_added", note, namespace=NAMESPACE)
    utils.log_user_activity(f"Note added: {title}")
    return jsonify(note), 201

@bp.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    payload = request.get_json() or {}
    notes = _read_notes()
    for i, n in enumerate(notes):
        if int(n.get("id", -1)) == note_id:
            n["title"] = payload.get("title", n.get("title"))
            n["content"] = payload.get("content", n.get("content"))
            n["updated"] = utils.timestamp()
            notes[i] = n
            _write_notes(notes)
            socketio.emit("note_updated", n, namespace=NAMESPACE)
            utils.log_user_activity(f"Note updated: {n['title']}")
            return jsonify(n)
    return jsonify({"error": "not found"}), 404

@bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    notes = _read_notes()
    new_notes = [n for n in notes if int(n.get("id", -1)) != note_id]
    if len(new_notes) == len(notes):
        return jsonify({"error": "not found"}), 404
    _write_notes(new_notes)
    socketio.emit("note_deleted", {"id": note_id}, namespace=NAMESPACE)
    utils.log_user_activity(f"Note deleted: {note_id}")
    return jsonify({"ok": True})