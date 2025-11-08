import eventlet
eventlet.monkey_patch()

import logging
import socket
from backend.socket import socketio, _app
from backend.routes.tasks_routes import bp as tasks_bp
from backend.routes.notes_routes import bp as notes_bp
from backend.routes.subjects_routes import bp as subjects_bp
from backend.routes.study_routes import bp as study_bp
import backend.socket.events  # Import socket events

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)
for logger_name in ['socketio', 'engineio', 'werkzeug']:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(logging.StreamHandler())

# Register blueprints
_app.register_blueprint(tasks_bp)
_app.register_blueprint(notes_bp)
_app.register_blueprint(subjects_bp)
_app.register_blueprint(study_bp)

# Start the server
print("🔌 Starting server at http://0.0.0.0:5000")
socketio.run(_app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True, debug=True)