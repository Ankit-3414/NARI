import socketio
import time
import logging
import sys

# Set up logging
logging.basicConfig(level=logging.DEBUG)
for logger_name in ['socketio', 'engineio', 'websocket']:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(logging.StreamHandler())

def test_websocket_connection():
    print("Creating Socket.IO client...")
    sio = socketio.Client(
        logger=True,
        engineio_logger=True,
        ssl_verify=False,
        request_timeout=10
    )

    @sio.event
    def connect():
        print("✓ Connected to server")

    @sio.event
    def connect_error(data):
        print("✗ Connection failed:", data)

    @sio.event
    def disconnect():
        print("✗ Disconnected from server")

    @sio.on('*', namespace='/nari')
    def catch_all(event, data):
        print(f"Received event '{event}': {data}")

    try:
        print("Attempting connection to server...")
        sio.connect(
            'http://localhost:5000',
            namespaces=['/nari'],
            wait_timeout=10,
            transports=['websocket']
        )
        
        print("Connection successful! Waiting for events...")
        # Keep the connection alive for a while
        time.sleep(2)

        # Try to trigger some events by creating a task
        import requests
        print("\nTesting event emission by creating a task...")
        response = requests.post(
            'http://localhost:5000/api/tasks',
            json={"title": "WebSocket Test Task"}
        )
        print(f"Task creation response: {response.status_code}")
        
        # Wait to receive the event
        time.sleep(3)
        
    except Exception as e:
        print(f"Error occurred: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
    finally:
        print("\nClosing connection...")
        try:
            sio.disconnect()
        except:
            pass

if __name__ == "__main__":
    print("=== WebSocket Connection Test ===")
    test_websocket_connection()