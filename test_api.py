import requests
import json

BASE_URL = "http://localhost:5000"

def test_tasks():
    # Create a task
    response = requests.post(f"{BASE_URL}/api/tasks", 
                           json={"title": "Test task"})
    print("Create task response:", response.status_code)
    print(response.json())
    
    # Get all tasks
    response = requests.get(f"{BASE_URL}/api/tasks")
    print("\nGet tasks response:", response.status_code)
    print(json.dumps(response.json(), indent=2))

def test_subjects():
    # Create a subject
    response = requests.post(f"{BASE_URL}/api/subjects",
                           json={"name": "Mathematics"})
    print("Create subject response:", response.status_code)
    print(response.json())
    
    # Get all subjects
    response = requests.get(f"{BASE_URL}/api/subjects")
    print("\nGet subjects response:", response.status_code)
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Testing tasks API...")
    test_tasks()
    print("\nTesting subjects API...")
    test_subjects()