from flask import Blueprint, request, jsonify, current_app
from backend.core.logger import clock_logger

bp = Blueprint('clock', __name__, url_prefix='/api/clock')

def get_clock_manager():
    return current_app.clock_manager

@bp.route('/alarms', methods=['GET'])
def get_alarms():
    manager = get_clock_manager()
    return jsonify(manager.alarms)

@bp.route('/alarms', methods=['POST'])
def add_alarm():
    data = request.json
    name = data.get('name')
    time_str = data.get('time')
    repeat = data.get('repeat', False)
    
    if not name or not time_str:
        return jsonify({"error": "Name and time are required"}), 400
        
    manager = get_clock_manager()
    result = manager.add_alarm(name, time_str, repeat)
    
    if result:
        return jsonify(result), 201
    else:
        return jsonify({"error": "Duplicate alarm or invalid data"}), 400

@bp.route('/alarms/<alarm_id>', methods=['DELETE'])
def delete_alarm(alarm_id):
    manager = get_clock_manager()
    manager.delete_alarm(alarm_id)
    return jsonify({"success": True})

@bp.route('/alarms/<alarm_id>/toggle', methods=['POST'])
def toggle_alarm(alarm_id):
    data = request.json
    enabled = data.get('enabled', True)
    
    manager = get_clock_manager()
    if manager.toggle_alarm(alarm_id, enabled):
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Alarm not found"}), 404

@bp.route('/alarms/dismiss', methods=['POST'])
def dismiss_alarm():
    data = request.json
    alarm_id = data.get('id')
    
    # Broadcast dismiss event to all clients
    # We need access to socketio. It's in manager.socketio
    manager = get_clock_manager()
    if manager.socketio:
        manager.socketio.emit('alarm_dismissed', {'id': alarm_id})
        
    return jsonify({"success": True})
