from flask import Blueprint, jsonify, request
from modules.notes_manager import NotesManager

bp = Blueprint('notes', __name__, url_prefix='/api/notes')
notes_manager = NotesManager()

@bp.route('/', methods=['GET'])
def get_notes():
    notes = notes_manager.get_all_notes()
    return jsonify(notes)

@bp.route('/', methods=['POST'])
def create_note():
    note_data = request.json
    note = notes_manager.add_note(note_data)
    return jsonify(note), 201

@bp.route('/<int:note_id>', methods=['GET'])
def get_note(note_id):
    note = notes_manager.get_note(note_id)
    if note:
        return jsonify(note)
    return jsonify({"error": "Note not found"}), 404

@bp.route('/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    note_data = request.json
    note = notes_manager.update_note(note_id, note_data)
    if note:
        return jsonify(note)
    return jsonify({"error": "Note not found"}), 404

@bp.route('/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    if notes_manager.delete_note(note_id):
        return '', 204
    return jsonify({"error": "Note not found"}), 404