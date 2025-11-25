from flask import Blueprint, request, jsonify
from modules import subjects as subjects_mod
from backend.socket import socketio, NAMESPACE

bp = Blueprint("subjects_routes", __name__)

@bp.route("/api/subjects", methods=["GET"])
def get_subjects():
    return jsonify(subjects_mod.load_subjects())

@bp.route("/api/subjects", methods=["POST"])
def add_subject():
    payload = request.get_json() or {}
    name = payload.get("name")
    if not name:
        return jsonify({"error": "name required"}), 400
    subjects = subjects_mod.load_subjects()
    if name in subjects:
        return jsonify({"error": "exists"}), 409
    subjects.append(name)
    subjects_mod.save_subjects(subjects)
    socketio.emit("subject_added", {"name": name}, namespace=NAMESPACE)
    return jsonify({"name": name}), 201

@bp.route("/api/subjects/<string:name>", methods=["DELETE"])
def remove_subject(name):
    subjects = subjects_mod.load_subjects()
    if name not in subjects:
        return jsonify({"error": "not found"}), 404
    subjects.remove(name)
    subjects_mod.save_subjects(subjects)
    socketio.emit("subject_removed", {"name": name}, namespace=NAMESPACE)
    return jsonify({"ok": True})