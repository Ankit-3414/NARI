import threading
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    return app

# Create the Flask app
_app = create_app()

# Create SocketIO instance with the app
from flask_socketio import SocketIO

socketio = SocketIO(
    _app,
    async_mode='eventlet',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    ping_timeout=5,
    ping_interval=2,
    always_connect=True,
    manage_session=False
)
NAMESPACE = "/nari"

# Export socketio for other modules
__all__ = ['socketio', 'NAMESPACE']
