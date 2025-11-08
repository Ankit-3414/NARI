from backend.socket import socketio, NAMESPACE
from flask_socketio import emit

@socketio.on("connect", namespace=NAMESPACE)
def handle_connect():
    # When client connects, we can emit a welcome or initial summary if needed.
    emit("connected", {"ok": True, "namespace": NAMESPACE})

@socketio.on("disconnect", namespace=NAMESPACE)
def handle_disconnect():
    # optional logging
    pass