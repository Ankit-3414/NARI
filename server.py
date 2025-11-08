import eventlet
from app import app, socketio

# Lightweight server runner for the web interface.
# Usage:
#   python server.py
# This will start the Flask + Flask-SocketIO server (uses eventlet async mode).

if __name__ == '__main__':
    # Apply monkey patching for eventlet
    eventlet.monkey_patch()
    print("Starting NARI server on http://localhost:5000")
    # Run the socketio server; debug=True enabled for development
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
