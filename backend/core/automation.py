import json
import os
import time
import threading
import queue
from datetime import datetime
from backend.core.logger import automation_logger
from backend.core.maintenance import AutoRecovery

AUTOMATION_FILE = os.path.join("data", "automation", "automation.json")

class AutomationEngine:
    def __init__(self, socketio=None):
        self.socketio = socketio
        self.recovery = AutoRecovery()
        self.running = False
        self.worker_thread = None
        self.task_queue = queue.PriorityQueue()
        self.rules = []
        self._load_rules()

    def start(self):
        """Starts the automation worker loop."""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()
            automation_logger.info("Automation engine started.")

    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=1)

    def _worker_loop(self):
        """Process tasks from the priority queue."""
        while self.running:
            try:
                # Get task with timeout to allow checking self.running
                try:
                    priority, task = self.task_queue.get(timeout=1)
                except queue.Empty:
                    continue

                automation_logger.info(f"Processing task: {task.get('type')} (Priority: {priority})")
                self._execute_task(task)
                self.task_queue.task_done()
                
            except Exception as e:
                automation_logger.error(f"Error in automation worker: {e}")
                time.sleep(1)

    def _execute_task(self, task):
        """Executes a single automation task."""
        task_type = task.get('type')
        payload = task.get('payload', {})
        
        # Broadcast event to UI
        if self.socketio:
            self.socketio.emit('automation_event', {
                'type': task_type,
                'payload': payload,
                'timestamp': datetime.now().isoformat()
            })

        # Logic for different task types
        if task_type == 'alarm_trigger':
            self._handle_alarm_trigger(payload)
        elif task_type == 'system_event':
            self._handle_system_event(payload)
        # Add more handlers here

    def _handle_alarm_trigger(self, payload):
        automation_logger.info(f"Handling alarm trigger: {payload.get('name')}")
        # Future: Trigger physical devices, play sound via server, etc.

    def _handle_system_event(self, payload):
        automation_logger.info(f"Handling system event: {payload}")

    def trigger_event(self, event_type, payload, priority=2):
        """
        Triggers an event to be processed by the automation engine.
        Priority: 1 (High), 2 (Medium), 3 (Low)
        """
        task = {
            'type': event_type,
            'payload': payload,
            'created_at': time.time()
        }
        self.task_queue.put((priority, task))
        automation_logger.info(f"Event queued: {event_type} (Priority: {priority})")

    def _load_rules(self):
        """Loads automation rules from JSON."""
        self.recovery.ensure_file_integrity(AUTOMATION_FILE, default_content=[])
        try:
            with open(AUTOMATION_FILE, 'r') as f:
                self.rules = json.load(f)
        except Exception as e:
            automation_logger.error(f"Failed to load automation rules: {e}")
            self.rules = []

    def _save_rules(self):
        """Saves automation rules."""
        try:
            if os.path.exists(AUTOMATION_FILE):
                self.recovery.create_backup(AUTOMATION_FILE)
            
            with open(AUTOMATION_FILE, 'w') as f:
                json.dump(self.rules, f, indent=4)
                
            self.recovery.integrity_checker.update_hash(AUTOMATION_FILE)
        except Exception as e:
            automation_logger.error(f"Failed to save automation rules: {e}")
