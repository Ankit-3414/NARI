import os
from datetime import datetime
from modules import utils

class StudyManager:
    def __init__(self):
        self.logs_dir = "data/logs"
        self.master_log = "data/logs/master.json"
        utils.ensure_directory(self.logs_dir)
        # Track one active session in memory for simple CLI/API usage
        self.active_session = None

    def get_all_sessions(self):
        sessions = utils.load_json(self.master_log) or {}
        return sessions.get("sessions", [])

    def get_session(self, session_id):
        sessions = self.get_all_sessions()
        return next((s for s in sessions if s.get("id") == session_id), None)

    def start_session(self, session_data):
        subject = session_data.get("subject")
        if not subject:
            return None
        # Start and remember the active session
        start_time = datetime.now()
        session = {
            "subject": subject,
            "start_time": start_time.strftime("%H:%M"),
            "date": start_time.strftime("%Y-%m-%d"),
            "status": "active",
            "started_at": start_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        # store as active session with datetime object for stopping
        self.active_session = {"subject": subject, "start_time_dt": start_time}
        return session

    def stop_active_session(self, save=True):
        """Stop the currently active session. If save=True, persist to logs."""
        if not self.active_session:
            return None
        subject = self.active_session.get("subject")
        start_time = self.active_session.get("start_time_dt")
        end_time = datetime.now()
        # Save to files
        saved = self.save_session(subject, start_time, end_time)
        # clear active session
        self.active_session = None
        return saved

    def get_status(self):
        """Return currently active session info or None."""
        if not self.active_session:
            return None
        start_time = self.active_session.get("start_time_dt")
        return {
            "subject": self.active_session.get("subject"),
            "start_time": start_time.strftime("%H:%M"),
            "date": start_time.strftime("%Y-%m-%d"),
            "status": "active",
            "started_at": start_time.strftime("%Y-%m-%d %H:%M:%S")
        }

    def update_session(self, session_id, session_data):
        session = self.get_session(session_id)
        if not session:
            return None
            
        session.update(session_data)
        return session

    def delete_session(self, session_id):
        sessions = self.get_all_sessions()
        new_sessions = [s for s in sessions if s.get("id") != session_id]
        if len(new_sessions) < len(sessions):
            utils.save_json(self.master_log, {"sessions": new_sessions})
            return True
        return False

    def save_session(self, subject, start_time, end_time):
        """Save completed study session"""
        date_str = start_time.strftime("%Y-%m-%d")
        log_file = os.path.join(self.logs_dir, f"{date_str}.json")

        # Load or init daily log
        data = utils.load_json(log_file) or {
            "date": date_str,
            "sessions": [],
            "total_time_minutes": 0
        }

        elapsed_minutes = int((end_time - start_time).total_seconds() // 60)
        session = {
            "subject": subject,
            "start_time": start_time.strftime("%H:%M"),
            "end_time": end_time.strftime("%H:%M"),
            "elapsed_minutes": elapsed_minutes
        }

        data["sessions"].append(session)
        data["total_time_minutes"] = data.get("total_time_minutes", 0) + elapsed_minutes
        utils.save_json(log_file, data)

        # Update master log
        master_data = utils.load_json(self.master_log) or {"sessions": []}
        session_with_date = {"date": date_str, **session}
        master_data["sessions"].append(session_with_date)
        utils.save_json(self.master_log, master_data)
        
        return session