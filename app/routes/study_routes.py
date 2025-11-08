from flask import Blueprint, jsonify, request
from modules.study_manager import StudyManager

bp = Blueprint('study', __name__, url_prefix='/api/study')
study_manager = StudyManager()

@bp.route('/sessions', methods=['GET'])
def get_study_sessions():
    sessions = study_manager.get_all_sessions()
    return jsonify(sessions)

@bp.route('/sessions', methods=['POST'])
def create_study_session():
    session_data = request.json
    session = study_manager.start_session(session_data)
    return jsonify(session), 201

@bp.route('/sessions/<int:session_id>', methods=['GET'])
def get_study_session(session_id):
    session = study_manager.get_session(session_id)
    if session:
        return jsonify(session)
    return jsonify({"error": "Study session not found"}), 404

@bp.route('/sessions/<int:session_id>', methods=['PUT'])
def update_study_session(session_id):
    session_data = request.json
    session = study_manager.update_session(session_id, session_data)
    if session:
        return jsonify(session)
    return jsonify({"error": "Study session not found"}), 404

@bp.route('/sessions/<int:session_id>', methods=['DELETE'])
def delete_study_session(session_id):
    if study_manager.delete_session(session_id):
        return '', 204
    return jsonify({"error": "Study session not found"}), 404


# Compatibility endpoints used by external tests/CLI
@bp.route('/status', methods=['GET'])
def study_status():
    status = study_manager.get_status()
    if status:
        return jsonify(status)
    # Return a JSON body even when no active session exists so clients can
    # safely call response.json() (tests expect JSON even on 404)
    return jsonify({"active": False, "message": "no active session"}), 404


@bp.route('/start', methods=['POST'])
def study_start():
    data = request.json or {}
    session = study_manager.start_session(data)
    if session:
        return jsonify(session), 200
    return jsonify({"error": "Invalid subject or could not start session"}), 400


@bp.route('/stop', methods=['POST'])
def study_stop():
    saved = study_manager.stop_active_session(save=True)
    if saved:
        return jsonify(saved), 200
    return jsonify({"error": "No active session to stop"}), 404