from flask import Blueprint, jsonify, request
from modules.task_manager import TaskManager

bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')
task_manager = TaskManager()

@bp.route('/', methods=['GET'])
def get_tasks():
    tasks = task_manager.get_all_tasks()
    return jsonify(tasks)

@bp.route('/', methods=['POST'])
def create_task():
    task_data = request.json
    task = task_manager.add_task(task_data)
    return jsonify(task), 201

@bp.route('/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = task_manager.get_task(task_id)
    if task:
        return jsonify(task)
    return jsonify({"error": "Task not found"}), 404

@bp.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task_data = request.json
    task = task_manager.update_task(task_id, task_data)
    if task:
        return jsonify(task)
    return jsonify({"error": "Task not found"}), 404

@bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    if task_manager.delete_task(task_id):
        return '', 204
    return jsonify({"error": "Task not found"}), 404