from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import sys
import os

# Ensure backend modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.core.clock_system import ClockManager
from backend.core.automation_engine import AutomationEngine

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize Core Systems
clock_manager = ClockManager(socketio=socketio)
automation_engine = AutomationEngine(socketio=socketio)

# Start Background Threads
clock_manager.start()
# Automation engine starts its thread in __init__

# Attach to app for access in routes
app.clock_manager = clock_manager
app.automation_engine = automation_engine

from app.routes import tasks_routes, notes_routes, study_routes, subjects_routes
from app.socket import socket_manager

app.register_blueprint(tasks_routes.bp)
app.register_blueprint(notes_routes.bp)
app.register_blueprint(study_routes.bp)
app.register_blueprint(subjects_routes.bp)