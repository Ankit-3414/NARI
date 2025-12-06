from socketio import Client
import time
import requests

def test_websocket():
    print("Connecting to WebSocket...")
    sio = Client(transport=['websocket', 'polling'])
    
    @sio.event(namespace='/nari')
    def connect():
        print("Connected!")
        print("Testing events by creating a task...")
        # Create a task using REST API to trigger websocket event
        response = requests.post(
            "http://localhost:5000/api/tasks",
            json={"title": "WebSocket Test Task"}
        )
        print("Task creation response:", response.status_code)
    
    @sio.event(namespace='/nari')
    def connect_error(data):
        print("Connection error:", data)
    
    @sio.event(namespace='/nari')
    def disconnect():
        print("Disconnected!")
    
    @sio.on('task_added', namespace='/nari')
    def on_task_added(data):
        print("Task added:", data)
    
    @sio.on('subject_added', namespace='/nari')
    def on_subject_added(data):
        print("Subject added:", data)

    try:
        print("Attempting connection...")
        sio.connect('http://localhost:5000', namespaces=['/nari'], transports=['websocket', 'polling'])
        print("Waiting for events...")
        time.sleep(10)  # Keep connection alive for 10 seconds
    except Exception as e:
        print("Connection failed:", e)
    finally:
        try:
            sio.disconnect()
        except:
            pass

if __name__ == "__main__":
    test_websocket()