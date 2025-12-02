import json
import os
import time
import threading
from datetime import datetime
import pytz
from backend.core.logger import clock_logger
from backend.core.maintenance import AutoRecovery

ALARMS_FILE = os.path.join("data", "clock", "alarms.json")
IST = pytz.timezone('Asia/Kolkata')

class ClockManager:
    def __init__(self, socketio=None):
        self.alarms = []
        self.socketio = socketio
        self.recovery = AutoRecovery()
        self.running = False
        self.worker_thread = None
        self._load_alarms()

    def start(self):
        """Starts the clock worker loop."""
        if not self.running:
            self.running = True
            if self.socketio:
                self.socketio.start_background_task(self._worker_loop)
                clock_logger.info("Clock system started (background task).")
            else:
                self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
                self.worker_thread.start()
                clock_logger.info("Clock system started (thread).")

    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=1)

    def _worker_loop(self):
        """Checks alarms every second."""
        while self.running:
            try:
                triggered = self.check_alarms()
                if triggered:
                    for alarm in triggered:
                        clock_logger.info(f"Triggering alarm: {alarm['name']}")
                        if self.socketio:
                            self.socketio.emit('alarm_triggered', alarm, namespace='/nari')
                            
                # Wait for next second
                time.sleep(1)
            except Exception as e:
                clock_logger.error(f"Error in clock worker: {e}")
                time.sleep(5)

    def _load_alarms(self):
        """Loads alarms from JSON with integrity check."""
        self.recovery.ensure_file_integrity(ALARMS_FILE, default_content=[])
        try:
            with open(ALARMS_FILE, 'r') as f:
                self.alarms = json.load(f)
                
            # Check for missed alarms
            now_str = datetime.now(IST).strftime("%Y-%m-%d %H:%M")
            missed = []
            for alarm in self.alarms:
                if alarm['enabled'] and alarm['time'] < now_str:
                    missed.append(alarm)
                    clock_logger.warning(f"Missed alarm detected: {alarm['name']} at {alarm['time']}")
                    
            if missed:
                clock_logger.info(f"Found {len(missed)} missed alarms on startup.")
                
        except Exception as e:
            clock_logger.error(f"Failed to load alarms: {e}")
            self.alarms = []

    def _save_alarms(self):
        """Saves alarms to JSON and updates hash."""
        try:
            # Create backup before save if file exists
            if os.path.exists(ALARMS_FILE):
                self.recovery.create_backup(ALARMS_FILE)
                
            with open(ALARMS_FILE, 'w') as f:
                json.dump(self.alarms, f, indent=4)
            
            # Update integrity hash
            self.recovery.integrity_checker.update_hash(ALARMS_FILE)
        except Exception as e:
            clock_logger.error(f"Failed to save alarms: {e}")

    def get_time(self):
        """Returns current IST time."""
        return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")

    def add_alarm(self, name, time_str, repeat=False):
        """
        Adds a new alarm.
        time_str format: "YYYY-MM-DD HH:MM"
        """
        # Check max alarms
        if len(self.alarms) >= 10:
            clock_logger.warning("Max alarms (10) reached. Cannot add more.")
            return False

        # Check for duplicates
        for alarm in self.alarms:
            if alarm['name'] == name and alarm['time'] == time_str:
                clock_logger.warning(f"Duplicate alarm blocked: {name} at {time_str}")
                return False

        new_alarm = {
            "id": str(int(time.time() * 1000)),
            "name": name,
            "time": time_str,
            "repeat": repeat,
            "enabled": True
        }
        self.alarms.append(new_alarm)
        self._save_alarms()
        clock_logger.info(f"Alarm added: {name} at {time_str}")
        
        # Emit Socket.IO event
        if self.socketio:
            self.socketio.emit('alarm_added', new_alarm, namespace='/nari')
        
        return new_alarm

    def delete_alarm(self, alarm_id):
        self.alarms = [a for a in self.alarms if a['id'] != alarm_id]
        self._save_alarms()
        clock_logger.info(f"Alarm deleted: {alarm_id}")
        
        # Emit Socket.IO event
        if self.socketio:
            self.socketio.emit('alarm_deleted', {'id': alarm_id}, namespace='/nari')

    def toggle_alarm(self, alarm_id, enabled):
        for alarm in self.alarms:
            if alarm['id'] == alarm_id:
                alarm['enabled'] = enabled
                self._save_alarms()
                clock_logger.info(f"Alarm {alarm_id} toggled to {enabled}")
                
                # Emit Socket.IO event
                if self.socketio:
                    self.socketio.emit('alarm_updated', alarm, namespace='/nari')
                
                return True
        return False

    def check_alarms(self):
        """
        Checks if any alarms should trigger.
        Returns a list of triggered alarms.
        """
        now_str = datetime.now(IST).strftime("%Y-%m-%d %H:%M")
        triggered = []

        # Debug logging
        if self.alarms:
            clock_logger.debug(f"Checking alarms at {now_str}, have {len(self.alarms)} alarm(s)")
            for alarm in self.alarms:
                clock_logger.debug(f"  Alarm: {alarm['name']} - time: {alarm['time']}, enabled: {alarm['enabled']}, match: {alarm['time'] == now_str}")

        for alarm in self.alarms:
            if alarm['enabled'] and alarm['time'] == now_str:
                triggered.append(alarm)
                
        # Process updates after iteration to avoid modifying list while iterating
        if triggered:
            for alarm in triggered:
                if alarm['repeat']:
                    dt = datetime.strptime(alarm['time'], "%Y-%m-%d %H:%M")
                    # Add 1 day
                    from datetime import timedelta
                    next_day = dt + timedelta(days=1)
                    alarm['time'] = next_day.strftime("%Y-%m-%d %H:%M")
                    clock_logger.info(f"Rescheduled repeating alarm {alarm['name']} to {alarm['time']}")
                else:
                    alarm['enabled'] = False
                    clock_logger.info(f"Disabled one-time alarm {alarm['name']}")
            
            self._save_alarms()
            
        return triggered
