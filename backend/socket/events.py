from backend.socket import socketio, NAMESPACE
from flask_socketio import emit
from flask import current_app
from modules import utils

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
    utils.log_user_activity(f"Task added: {data.get('title', 'Unknown')}")

@socketio.on("task_updated", namespace=NAMESPACE)
def handle_task_updated(data):
    current_app.logger.info(f"Task updated: {data}")
    utils.log_user_activity(f"Task updated: {data.get('title', 'Unknown')}")

@socketio.on("task_deleted", namespace=NAMESPACE)
def handle_task_deleted(data):
    current_app.logger.info(f"Task deleted: {data}")
    utils.log_user_activity(f"Task deleted: ID {data.get('id', 'Unknown')}")

@socketio.on("note_added", namespace=NAMESPACE)
def handle_note_added(data):
    current_app.logger.info(f"Note added: {data}")
    utils.log_user_activity(f"Note added: {data.get('title', 'Unknown')}")

@socketio.on("note_updated", namespace=NAMESPACE)
def handle_note_updated(data):
    current_app.logger.info(f"Note updated: {data}")
    utils.log_user_activity(f"Note updated: {data.get('title', 'Unknown')}")

@socketio.on("note_deleted", namespace=NAMESPACE)
def handle_note_deleted(data):
    current_app.logger.info(f"Note deleted: {data}")
    utils.log_user_activity(f"Note deleted: ID {data.get('id', 'Unknown')}")

@socketio.on("subject_added", namespace=NAMESPACE)
def handle_subject_added(data):
    current_app.logger.info(f"Subject added: {data}")
    utils.log_user_activity(f"Subject added: {data.get('name', 'Unknown')}")

@socketio.on("subject_removed", namespace=NAMESPACE)
def handle_subject_removed(data):
    current_app.logger.info(f"Subject removed: {data}")
    utils.log_user_activity(f"Subject removed: {data.get('name', 'Unknown')}")

@socketio.on("study_started", namespace=NAMESPACE)
def handle_study_started(data):
    current_app.logger.info(f"Study started: {data}")
    utils.log_user_activity(f"Study started: {data.get('subject', 'Unknown')}")

@socketio.on("study_stopped", namespace=NAMESPACE)
def handle_study_stopped(data):
    current_app.logger.info(f"Study stopped: {data}")
    utils.log_user_activity(f"Study stopped: {data.get('subject', 'Unknown')}")
