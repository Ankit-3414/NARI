import json
import os
import queue
import threading
import time
from backend.core.logger import automation_logger

AUTOMATION_FILE = os.path.join("data", "automation", "automation.json")

class AutomationEngine:
    def __init__(self, socketio=None):
        self.socketio = socketio
        self.high_priority = queue.Queue()
        self.medium_priority = queue.Queue()
        self.low_priority = queue.Queue()
        self.running = True
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

    def add_task(self, task_type, payload, priority="medium"):
        """
        Adds a task to the automation queue.
        priority: "high", "medium", "low"
        """
        task = {
            "type": task_type,
            "payload": payload,
            "timestamp": time.time(),
            "priority": priority
        }
        
        if priority == "high":
            self.high_priority.put(task)
        elif priority == "low":
            self.low_priority.put(task)
        else:
            self.medium_priority.put(task)
            
        automation_logger.info(f"Task queued [{priority}]: {task_type}")

    def _worker_loop(self):
        """Main loop to process tasks based on priority."""
        while self.running:
            try:
                # Check queues in order
                if not self.high_priority.empty():
                    task = self.high_priority.get()
                elif not self.medium_priority.empty():
                    task = self.medium_priority.get()
                elif not self.low_priority.empty():
                    task = self.low_priority.get()
                else:
                    time.sleep(0.1)
                    continue

                self._execute_task(task)
                
            except Exception as e:
                automation_logger.error(f"Error in automation worker: {e}")

    def _execute_task(self, task):
        """Executes the task logic."""
        automation_logger.info(f"Executing task: {task['type']}")
        
        # Echo to UI if SocketIO is available
        if self.socketio:
            self.socketio.emit('automation_event', task)

        # Handle specific task types
        if task['type'] == 'alarm_trigger':
            self._handle_alarm(task['payload'])
        elif task['type'] == 'system_restart':
            self._handle_restart(task['payload'])
        # Add more handlers here

    def _handle_alarm(self, payload):
        automation_logger.info(f"ALARM TRIGGERED: {payload.get('name')}")
        # Here we could trigger physical devices, play sound via CLI, etc.
        if self.socketio:
            self.socketio.emit('alarm_triggered', payload)

    def _handle_restart(self, payload):
        automation_logger.warning("System restart requested via automation.")
        # In a real scenario, we might call os.system('reboot') or similar
        pass

    def stop(self):
        self.running = False
        if self.worker_thread.is_alive():
            self.worker_thread.join(timeout=1)
