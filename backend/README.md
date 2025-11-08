# NARI Backend (Phase 2A)

## Requirements
pip install -r requirements.txt
(install: flask flask-socketio flask-cors eventlet python-dotenv)

## Run from CLI
Start NARI normally:
  python nari.py
This will start the backend as a daemon thread bound to 0.0.0.0:5000.

OR start backend directly (for dev):
  python -c "from backend.app import run_server_in_thread; run_server_in_thread(); import time; time.sleep(9999)"

## API examples
GET tasks:
  curl http://localhost:5000/api/tasks

POST task:
  curl -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d '{"title":"Read chapter 1"}'

Start study:
  curl -X POST http://localhost:5000/api/study/start -H "Content-Type: application/json" -d '{"subject":"Mathematics"}'

Stop study:
  curl -X POST http://localhost:5000/api/study/stop -H "Content-Type: application/json" -d '{"save":true}'

## Socket.IO
Connect a client to namespace: /nari
Example with socket.io-client (browser):
  const socket = io("http://<host>:5000/nari");
  socket.on("task_added", (data) => console.log("task added", data));
  socket.on("study_started", (data) => console.log("study started", data));

## Notes
- This backend reuses modules/utils.py for persistence; JSON files live in /data.
- Use eventlet in dev for websocket concurrency (already configured).