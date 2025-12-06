from flask import Blueprint, jsonify
from modules import utils

bp = Blueprint("activity_routes", __name__)

@bp.route("/api/activity", methods=["GET"])
def get_activity():
    return jsonify(utils.get_activity_log())
