import threading
from datetime import datetime
from modules import study as study_mod
from modules import utils
from backend.socket import socketio, NAMESPACE

_lock = threading.Lock()
_current = {
    "subject": None,
    "start_time": None  # datetime
}

# ...existing code...
def start_session(subject: str):
    with _lock:
        if _current["subject"] is not None:
            # already running
            return False, "session_already_running"
        _current["subject"] = subject
        _current["start_time"] = datetime.utcnow() # <--- CHANGED TO UTC
        # emit event
        socketio.emit("study_started", {"subject": subject, "start": _current["start_time"].isoformat() + "Z"}, namespace=NAMESPACE) # <--- ADDED "Z" for UTC
        return True, {"subject": subject, "start": _current["start_time"].isoformat() + "Z"} # <--- ADDED "Z" for UTC
# ...existing code...

# ...existing code...
def stop_session(save: bool = True):
    with _lock:
        if _current["subject"] is None:
            return False, "no_active_session"
        subject = _current["subject"]
        start_time = _current["start_time"]
        end_time = datetime.utcnow() # <--- CHANGED TO UTC
        elapsed_seconds = int((end_time - start_time).total_seconds())
        # clear current BEFORE potentially slow persistence to keep status consistent
        _current["subject"] = None
        _current["start_time"] = None

    # if saving, call study.save_session (this writes the JSON)
    if save:
        try:
            # study.save_session expects (subject, start_time: datetime, end_time: datetime)
            study_mod.save_session(subject, start_time, end_time)
        except Exception as e:
            # persistence failed — log and emit event anyway
            utils.append_log("api_errors.log", f"Failed to save session: {e}")

    # emit event
    socketio.emit("study_stopped", {
        "subject": subject,
        "start": start_time.isoformat() + "Z", # <--- ADDED "Z" for UTC
        "end": end_time.isoformat() + "Z",     # <--- ADDED "Z" for UTC
        "elapsed_seconds": elapsed_seconds
    }, namespace=NAMESPACE)
    return True, {"subject": subject, "start": start_time.isoformat() + "Z", "end": end_time.isoformat() + "Z", "elapsed_seconds": elapsed_seconds}
# ...existing code...

# ...existing code...
def get_status():
    with _lock:
        if _current["subject"] is None:
            return None
        return {
            "subject": _current["subject"],
            "start": _current["start_time"].isoformat() + "Z" # <--- ADDED "Z" for UTC
        }
