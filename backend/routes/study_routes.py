from flask import Blueprint, request, jsonify
from backend import session_manager
from modules import utils
from backend.socket import socketio, NAMESPACE

bp = Blueprint("study_routes", __name__)

@bp.route("/api/study/start", methods=["POST"])

@bp.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"ok": True})

@bp.route("/api/time", methods=["GET"])
def get_server_time():
    from datetime import datetime
    return jsonify({"serverTime": datetime.utcnow().isoformat() + "Z"})