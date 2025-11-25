from backend.socket import socketio, _app

# register blueprints
from backend.routes.tasks_routes import bp as tasks_bp
from backend.routes.notes_routes import bp as notes_bp
from backend.routes.subjects_routes import bp as subjects_bp
from backend.routes.study_routes import bp as study_bp
# import socket events
import backend.socket.events as socket_events

# Register API blueprints
_app.register_blueprint(tasks_bp)
_app.register_blueprint(notes_bp)
_app.register_blueprint(subjects_bp)
_app.register_blueprint(study_bp)