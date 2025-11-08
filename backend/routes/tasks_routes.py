import os
import json
from flask import Blueprint, request, jsonify, current_app
from modules import utils
from backend.socket import socketio, NAMESPACE

bp = Blueprint("tasks_routes", __name__)

TASKS_FILE = utils.TASKS_FILE

def _read_tasks():
    data = utils.load_json(TASKS_FILE) or {}
    return data.get("tasks", [])

def _write_tasks(tasks):
    utils.save_json(TASKS_FILE, {"tasks": tasks})

@bp.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify(_read_tasks())

@bp.route("/api/tasks", methods=["POST"])
def create_task():
    payload = request.get_json() or {}
    title = payload.get("title")
    if not title:
        return jsonify({"error": "title is required"}), 400
    priority = payload.get("priority", "normal")
    due = payload.get("due")
    tasks = _read_tasks()
    new_id = utils.next_id(tasks)
    item = {
        "id": new_id,
        "title": title,
        "priority": priority,
        "due": due,
        "status": "pending",
        "created": utils.timestamp()
    }
    tasks.append(item)
    _write_tasks(tasks)
    socketio.emit("task_added", item, namespace=NAMESPACE)
    return jsonify(item), 201

@bp.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    tasks = _read_tasks()
    t = next((x for x in tasks if int(x.get("id", -1)) == task_id), None)
    if not t:
        return jsonify({"error": "not found"}), 404
    return jsonify(t)

@bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    payload = request.get_json() or {}
    tasks = _read_tasks()
    found = False
    updated = None
    for i, t in enumerate(tasks):
        if int(t.get("id", -1)) == task_id:
            found = True
            if "title" in payload:
                t["title"] = payload["title"]
            if "priority" in payload:
                t["priority"] = payload["priority"]
            if "due" in payload:
                t["due"] = payload["due"]
            if "status" in payload:
                t["status"] = payload["status"]
                if payload["status"] == "completed":
                    t["completed_at"] = utils.timestamp()
            t["updated_at"] = utils.timestamp()
            tasks[i] = t
            updated = t
            break
    if not found:
        return jsonify({"error": "not found"}), 404
    _write_tasks(tasks)
    socketio.emit("task_updated", updated, namespace=NAMESPACE)
    return jsonify(updated)

@bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = _read_tasks()
    new_tasks = [t for t in tasks if int(t.get("id", -1)) != task_id]
    if len(new_tasks) == len(tasks):
        return jsonify({"error": "not found"}), 404
    _write_tasks(new_tasks)
    socketio.emit("task_deleted", {"id": task_id}, namespace=NAMESPACE)
    return jsonify({"ok": True})