import requests
import socketio
import time
import json
from datetime import datetime

class NARITester:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.sio = socketio.Client(logger=True)
        self.events_received = []
        
        # Set up WebSocket event handlers
        @self.sio.event(namespace='/nari')
        def connect():
            print("✓ WebSocket connected!")

        @self.sio.on('task_added', namespace='/nari')
        def on_task_added(data):
            print("➜ WebSocket event received: task_added")
            print(json.dumps(data, indent=2))
            self.events_received.append(('task_added', data))

        @self.sio.on('task_updated', namespace='/nari')
        def on_task_updated(data):
            print("➜ WebSocket event received: task_updated")
            print(json.dumps(data, indent=2))
            self.events_received.append(('task_updated', data))

        @self.sio.on('subject_added', namespace='/nari')
        def on_subject_added(data):
            print("➜ WebSocket event received: subject_added")
            print(json.dumps(data, indent=2))
            self.events_received.append(('subject_added', data))

    def connect_websocket(self):
        """Connect to WebSocket server"""
        try:
            self.sio.connect(
                self.base_url,
                namespaces=['/nari'],
                transports=['websocket'],
                wait_timeout=10
            )
            time.sleep(1)  # Give it a moment to establish connection
            return True
        except Exception as e:
            print("✗ WebSocket connection failed:", e)
            return False

    def test_tasks_api(self):
        """Test CRUD operations for tasks"""
        print("\n=== Testing Tasks API ===")
        
        # CREATE task
        print("\n1. Creating new task...")
        response = requests.post(
            f"{self.base_url}/api/tasks",
            json={"title": f"Test task created at {datetime.now().strftime('%H:%M:%S')}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            task = response.json()
            print("Task created:")
            print(json.dumps(task, indent=2))
            task_id = task['id']
            
            # UPDATE task
            print("\n2. Updating task...")
            response = requests.put(
                f"{self.base_url}/api/tasks/{task_id}",
                json={"status": "completed"}
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Task updated:")
                print(json.dumps(response.json(), indent=2))
            
            # DELETE task
            print("\n3. Deleting task...")
            response = requests.delete(f"{self.base_url}/api/tasks/{task_id}")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Task deleted successfully")

        # LIST all tasks
        print("\n4. Listing all tasks...")
        response = requests.get(f"{self.base_url}/api/tasks")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("All tasks:")
            print(json.dumps(response.json(), indent=2))

    def test_subjects_api(self):
        """Test CRUD operations for subjects"""
        print("\n=== Testing Subjects API ===")
        
        # CREATE subject
        subject_name = f"Test Subject {datetime.now().strftime('%H:%M:%S')}"
        print(f"\n1. Creating new subject: {subject_name}")
        response = requests.post(
            f"{self.base_url}/api/subjects",
            json={"name": subject_name}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("Subject created:")
            print(json.dumps(response.json(), indent=2))
            
            # DELETE subject
            print("\n2. Deleting subject...")
            response = requests.delete(f"{self.base_url}/api/subjects/{subject_name}")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Subject deleted successfully")
        
        # LIST all subjects
        print("\n3. Listing all subjects...")
        response = requests.get(f"{self.base_url}/api/subjects")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("All subjects:")
            print(json.dumps(response.json(), indent=2))

    def test_study_api(self):
        """Test study session management"""
        print("\n=== Testing Study API ===")
        
        # Get initial status
        print("\n1. Getting initial status...")
        response = requests.get(f"{self.base_url}/api/study/status")
        print(f"Status: {response.status_code}")
        print("Initial status:", response.json())
        
        # Start session
        print("\n2. Starting study session...")
        response = requests.post(
            f"{self.base_url}/api/study/start",
            json={"subject": "Test Subject"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Session started:")
            print(json.dumps(response.json(), indent=2))
            
            # Get status while running
            print("\n3. Getting status during session...")
            response = requests.get(f"{self.base_url}/api/study/status")
            print(f"Status: {response.status_code}")
            print("Current status:", response.json())
            
            # Stop session
            print("\n4. Stopping study session...")
            response = requests.post(f"{self.base_url}/api/study/stop")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Session stopped:")
                print(json.dumps(response.json(), indent=2))

    def run_all_tests(self):
        """Run all API and WebSocket tests"""
        print("Starting NARI API and WebSocket tests...")
        
        # Connect to WebSocket first
        if not self.connect_websocket():
            print("Skipping WebSocket tests, continuing with API tests...")
        
        # Run all API tests
        self.test_tasks_api()
        self.test_subjects_api()
        self.test_study_api()
        
        # Show WebSocket events received
        print("\n=== WebSocket Events Received ===")
        if self.events_received:
            for event_type, data in self.events_received:
                print(f"\nEvent: {event_type}")
                print(json.dumps(data, indent=2))
        else:
            print("No WebSocket events received")
        
        # Cleanup
        try:
            self.sio.disconnect()
        except:
            pass

if __name__ == "__main__":
    tester = NARITester()
    tester.run_all_tests()