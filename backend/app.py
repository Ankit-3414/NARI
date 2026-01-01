from backend.socket import socketio, _app
from backend.core.clock_system import ClockManager
from backend.core.automation import AutomationEngine
from backend.core.maintenance import AutoRecovery
from modules import utils

# Initialize Core Systems
clock_manager = ClockManager(socketio)
automation_engine = AutomationEngine(socketio)
recovery_system = AutoRecovery()

# Perform startup integrity checks
print("--- Starting Integrity Check ---")
for file_path in [utils.SUBJECTS_FILE, utils.TASKS_FILE, utils.NOTES_FILE]:
    recovery_system.ensure_file_integrity(file_path)
print("--- Integrity Check Complete ---")

# Attach to app for route access
_app.clock_manager = clock_manager
_app.automation_engine = automation_engine
_app.recovery_system = recovery_system

# register blueprints
from backend.routes.tasks_routes import bp as tasks_bp
from backend.routes.notes_routes import bp as notes_bp
from backend.routes.subjects_routes import bp as subjects_bp
from backend.routes.study_routes import bp as study_bp
from backend.routes.clock_routes import bp as clock_bp
from backend.routes.activity_routes import bp as activity_bp

# import socket events
import backend.socket.events as socket_events

# Register API blueprints
_app.register_blueprint(tasks_bp)
_app.register_blueprint(notes_bp)
_app.register_blueprint(subjects_bp)
_app.register_blueprint(study_bp)
_app.register_blueprint(clock_bp)
_app.register_blueprint(activity_bp)

@_app.before_request
def log_request_info():
    # Only log API calls, skip static files or health checks if too noisy
    if request.path.startswith('/api') and not request.path.endswith('/health') and not request.path.endswith('/activity'):
        method = request.method
        path = request.path
        utils.log_user_activity(f"API: {method} {path}")

from flask import request
# Export for manual starting

__all__ = ['_app', 'clock_manager', 'automation_engine', 'recovery_system']
