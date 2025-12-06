from backend.socket import socketio, _app
from backend.core.clock_system import ClockManager
from backend.core.automation import AutomationEngine

# Initialize Core Systems
clock_manager = ClockManager(socketio)
automation_engine = AutomationEngine(socketio)

# Start background threads
# clock_manager.start()
# automation_engine.start()

# Attach to app for route access
_app.clock_manager = clock_manager
from backend.socket import socketio, _app
from backend.core.clock_system import ClockManager
from backend.core.automation import AutomationEngine

# Initialize Core Systems
clock_manager = ClockManager(socketio)
automation_engine = AutomationEngine(socketio)

# Start background threads
# clock_manager.start()
# automation_engine.start()

# Attach to app for route access
_app.clock_manager = clock_manager
_app.automation_engine = automation_engine

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

# Export for manual starting
__all__ = ['_app', 'clock_manager', 'automation_engine']