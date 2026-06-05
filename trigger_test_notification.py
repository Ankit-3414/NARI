#!/usr/bin/env python3
"""Script to push a test notification/reminder to all connected NARI devices.

This script reads the backend config from backend/.env and posts a reminder
scheduled to trigger immediately, which prompts the server's background loop
to broadcast a WebSocket alert and play the alarm sound on all open UI instances.
"""

import os
import sys
import json
from datetime import datetime, timezone
import urllib.request
import urllib.error

def load_env(env_path):
    """Load key-value pairs from an env file."""
    env = {}
    if not os.path.exists(env_path):
        return env
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

def main():
    print("NARI Notification Test System Initiated...")
    
    # Resolve project paths
    root_dir = os.path.abspath(os.path.dirname(__file__))
    backend_env_path = os.path.join(root_dir, "backend", ".env")
    
    # Load environment variables
    env = load_env(backend_env_path)
    
    api_key = env.get("NARI_API_KEY") or os.getenv("NARI_API_KEY")
    if not api_key:
        print(f"Error: Could not locate NARI_API_KEY in environment or at: {backend_env_path}", file=sys.stderr)
        print("Please configure NARI_API_KEY inside your backend/.env file first.", file=sys.stderr)
        sys.exit(1)
        
    port = env.get("NARI_PORT", "8000")
    host = env.get("NARI_HOST", "127.0.0.1")
    if host == "0.0.0.0":
        host = "127.0.0.1"
        
    api_url = f"http://{host}:{port}/api/v1/reminders"
    
    print(f"Server Target: {api_url}")
    print("Formatting test alert payload...")
    
    # Create reminder due in the past (UTC) to trigger immediately
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    payload = {
        "title": "TELEMETRY CONNECTION INTEGRITY TEST",
        "message": f"Verified at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} local time. Network connection optimal.",
        "due_at": now_utc,
        "status": "scheduled",
        "is_active": True
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url, 
        data=data, 
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("ok"):
                reminder = res_data["data"]
                print(f"Success! Registered test reminder ID #{reminder.get('id')}.")
                print("The NARI server will broadcast the alarm signal to all active browsers in ~1 second.")
            else:
                err_msg = res_data.get("error", {}).get("message", "Unknown backend error")
                print(f"Server Error: {err_msg}", file=sys.stderr)
                sys.exit(1)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            err_data = json.loads(body)
            err_msg = err_data.get("error", {}).get("message", body)
        except Exception:
            err_msg = body
        print(f"HTTP Error {e.code}: {err_msg}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Connection Failure: Cannot reach NARI server at {api_url}.", file=sys.stderr)
        print("Please verify the backend server is running (e.g., 'uv run python run.py' from backend/).", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
