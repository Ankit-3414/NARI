from flask_socketio import Namespace
from app import socketio

class NARINamespace(Namespace):
    def on_connect(self):
        socketio.emit('connected', {'ok': True, 'namespace': '/nari'}, namespace='/nari')

    def on_disconnect(self):
        pass

socketio.on_namespace(NARINamespace('/nari'))