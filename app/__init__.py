from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

from app.routes import tasks_routes, notes_routes, study_routes, subjects_routes
from app.socket import socket_manager

app.register_blueprint(tasks_routes.bp)
app.register_blueprint(notes_routes.bp)
app.register_blueprint(study_routes.bp)
app.register_blueprint(subjects_routes.bp)