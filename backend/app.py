import threading
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

def run_server_in_thread(host="0.0.0.0", port=5000):
    """
    Start the SocketIO server in a daemon thread.
    """
    def _run():
        # using socketio.run with eventlet backend
        socketio.run(_app, host=host, port=port, allow_unsafe_werkzeug=True)
    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return t