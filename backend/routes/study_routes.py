from flask import Blueprint, request, jsonify
from backend import session_manager
from modules import utils
from backend.socket import socketio, NAMESPACE

bp = Blueprint("study_routes", __name__)

@bp.route("/api/study/start", methods=["POST"])
def start_study():
    payload = request.json or {}
    subject = payload.get("subject")
    if not subject:
        return jsonify({"error": "subject is required"}), 400
    ok, result = session_manager.start_session(subject)
    if not ok:
        return jsonify({"error": result}), 400
    return jsonify(result), 201

@bp.route("/api/study/stop", methods=["POST"])
def stop_study():
    payload = request.json or {}
    save = payload.get("save", True)
    ok, result = session_manager.stop_session(save=save)
    if not ok:
        return jsonify({"error": result}), 400
    return jsonify(result)

@bp.route("/api/study/status", methods=["GET"])
def get_study_status():
    status = session_manager.get_status()
    return jsonify(status)

@bp.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"ok": True})

@bp.route("/api/time", methods=["GET"])
def get_server_time():
    from datetime import datetime
    return jsonify({"serverTime": datetime.utcnow().isoformat() + "Z"})
