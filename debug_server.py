import eventlet
eventlet.monkey_patch()

import sys
import time
from flask import Flask

print("1. Starting debug script...")
sys.stdout.flush()

try:
    print("2. Importing backend.socket...")
    sys.stdout.flush()
    from backend.socket import socketio, _app as app
    print("   ✅ backend.socket imported")
except Exception as e:
    print(f"   ❌ Failed to import backend.socket: {e}")
    sys.exit(1)

try:
    print("3. Importing backend.core.clock_system...")
    sys.stdout.flush()
    from backend.core.clock_system import ClockManager
    print("   ✅ backend.core.clock_system imported")
except Exception as e:
    print(f"   ❌ Failed to import clock_system: {e}")
    sys.exit(1)

try:
    print("4. Importing backend.core.automation...")
    sys.stdout.flush()
    from backend.core.automation import AutomationEngine
    print("   ✅ backend.core.automation imported")
except Exception as e:
    print(f"   ❌ Failed to import automation: {e}")
    sys.exit(1)

try:
    print("5. Initializing ClockManager (no start)...")
    sys.stdout.flush()
    clock_manager = ClockManager(socketio)
    print("   ✅ ClockManager initialized")
except Exception as e:
    print(f"   ❌ Failed to init ClockManager: {e}")
    sys.exit(1)

try:
    print("6. Initializing AutomationEngine (no start)...")
    sys.stdout.flush()
    automation_engine = AutomationEngine(socketio)
    print("   ✅ AutomationEngine initialized")
except Exception as e:
    print(f"   ❌ Failed to init AutomationEngine: {e}")
    sys.exit(1)

print("7. Registering blueprints...")
sys.stdout.flush()
try:
    from backend.routes.tasks_routes import bp as tasks_bp
    from backend.routes.notes_routes import bp as notes_bp
    from backend.routes.subjects_routes import bp as subjects_bp
    from backend.routes.study_routes import bp as study_bp
    from backend.routes.clock_routes import bp as clock_bp

    app.register_blueprint(tasks_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(study_bp)
    app.register_blueprint(clock_bp)
    print("   ✅ Blueprints registered")
except Exception as e:
    print(f"   ❌ Failed to register blueprints: {e}")
    sys.exit(1)

print("8. Starting background threads...")
sys.stdout.flush()
try:
    clock_manager.start()
    print("   ✅ ClockManager started")
    automation_engine.start()
    print("   ✅ AutomationEngine started")
except Exception as e:
    print(f"   ❌ Failed to start background threads: {e}")
    sys.exit(1)

print("9. Starting Flask server on port 5001 (debug port)...")
sys.stdout.flush()
socketio.run(app, host='0.0.0.0', port=5001, debug=False, use_reloader=False)
