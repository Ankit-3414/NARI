from flask import Blueprint, jsonify, request
from modules.subjects_manager import SubjectsManager

bp = Blueprint('subjects', __name__, url_prefix='/api/subjects')
subjects_manager = SubjectsManager()

@bp.route('/', methods=['GET'])
def get_subjects():
    subjects = subjects_manager.get_all_subjects()
    return jsonify(subjects)

@bp.route('/', methods=['POST'])
def create_subject():
    subject_data = request.json
    subject = subjects_manager.add_subject(subject_data)
    return jsonify(subject), 201

@bp.route('/<int:subject_id>', methods=['GET'])
def get_subject(subject_id):
    subject = subjects_manager.get_subject(subject_id)
    if subject:
        return jsonify(subject)
    return jsonify({"error": "Subject not found"}), 404

@bp.route('/<int:subject_id>', methods=['PUT'])
def update_subject(subject_id):
    subject_data = request.json
    subject = subjects_manager.update_subject(subject_id, subject_data)
    if subject:
        return jsonify(subject)
    return jsonify({"error": "Subject not found"}), 404

@bp.route('/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    if subjects_manager.delete_subject(subject_id):
        return '', 204
    return jsonify({"error": "Subject not found"}), 404