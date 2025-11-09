from flask import Blueprint, request, jsonify
from backend import session_manager
from backend.socket import socketio, NAMESPACE

bp = Blueprint("study_routes", __name__)

@bp.route("/api/study/start", methods=["POST"])
def start():
    payload = request.get_json() or {}
    subject = payload.get("subject")
    if not subject:
        return jsonify({"error": "subject required"}), 400
    ok, result = session_manager.start_session(subject)
    if not ok:
        return jsonify({"error": result}), 409
    return jsonify(result)

@bp.route("/api/study/stop", methods=["POST"])
def stop():
    payload = request.get_json() or {}
    save = bool(payload.get("save", True))
    ok, result = session_manager.stop_session(save=save)
    if not ok:
        return jsonify({"error": result}), 400
    return jsonify(result)

@bp.route("/api/study/status", methods=["GET"])
def status():
    s = session_manager.get_status()
    return jsonify(s)

@bp.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"ok": True})