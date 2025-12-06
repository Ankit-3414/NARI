import os
from flask import Blueprint, send_from_directory, send_file

bp = Blueprint('frontend', __name__)

# Path to the frontend build directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'dist')

@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def serve_frontend(path):
    """Serve the React frontend"""
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    else:
        return send_file(os.path.join(FRONTEND_DIR, 'index.html'))
