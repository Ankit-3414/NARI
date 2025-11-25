from backend.socket import socketio, NAMESPACE
from flask_socketio import emit
from flask import current_app

@socketio.on("connect", namespace=NAMESPACE)
def handle_connect():
    # When client connects, we can emit a welcome or initial summary if needed.
    emit("connected", {"ok": True, "namespace": NAMESPACE})

@socketio.on("disconnect", namespace=NAMESPACE)
def handle_disconnect():
    # optional logging
    pass

@socketio.on("task_added", namespace=NAMESPACE)
def handle_task_added(data):
    current_app.logger.info(f"Task added: {data}")

@socketio.on("task_updated", namespace=NAMESPACE)
def handle_task_updated(data):
    current_app.logger.info(f"Task updated: {data}")

@socketio.on("task_deleted", namespace=NAMESPACE)
def handle_task_deleted(data):
    current_app.logger.info(f"Task deleted: {data}")

@socketio.on("note_added", namespace=NAMESPACE)
def handle_note_added(data):
    current_app.logger.info(f"Note added: {data}")

@socketio.on("note_updated", namespace=NAMESPACE)
def handle_note_updated(data):
    current_app.logger.info(f"Note updated: {data}")

@socketio.on("note_deleted", namespace=NAMESPACE)
def handle_note_deleted(data):
    current_app.logger.info(f"Note deleted: {data}")

@socketio.on("subject_added", namespace=NAMESPACE)
def handle_subject_added(data):
    current_app.logger.info(f"Subject added: {data}")

@socketio.on("subject_removed", namespace=NAMESPACE)
def handle_subject_removed(data):
    current_app.logger.info(f"Subject removed: {data}")

@socketio.on("study_started", namespace=NAMESPACE)
def handle_study_started(data):
    current_app.logger.info(f"Study started: {data}")

@socketio.on("study_stopped", namespace=NAMESPACE)
def handle_study_stopped(data):
    current_app.logger.info(f"Study stopped: {data}")