# Import the app WITHOUT starting clock/automation
from backend.socket import socketio, _app

# Manually register blueprints
from backend.routes.tasks_routes import bp as tasks_bp
from backend.routes.notes_routes import bp as notes_bp
from backend.routes.subjects_routes import bp as subjects_bp
from backend.routes.study_routes import bp as study_bp
from backend.routes.clock_routes import bp as clock_bp

_app.register_blueprint(tasks_bp)
_app.register_blueprint(notes_bp)
_app.register_blueprint(subjects_bp)
_app.register_blueprint(study_bp)
_app.register_blueprint(clock_bp)

if __name__ == "__main__":
    print("Starting minimal NARI server...")
    socketio.run(_app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
