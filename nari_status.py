import requests
import psutil
import signal

SERVER_URL = "http://localhost:5000"

def is_server_running():
    try:
        response = requests.get(SERVER_URL, timeout=2)
        return response.status_code in [200, 404]
    except requests.exceptions.RequestException:
        return False

def find_server_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = " ".join(proc.info['cmdline'])
            if "nari.py" in cmdline or "python" in proc.info['name']:
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return None

def stop_server(proc):
    try:
        proc.send_signal(signal.SIGINT)
        print("✅ Server stopped successfully.")
    except Exception as e:
        print(f"⚠️ Failed to stop server: {e}")

def main():
    print("🔍 Checking NARI server status...")
    if is_server_running():
        print("✅ Server is running at http://localhost:5000")
        choice = input("Do you want to stop the server? (y/n): ").strip().lower()
        if choice == "y":
            proc = find_server_process()
            if proc:
                stop_server(proc)
            else:
                print("⚠️ Could not find server process. You may need to stop it manually.")
        else:
            print("👍 Server will keep running.")
    else:
        print("❌ Server is not running.")
    print("👋 Exiting status checker.")

if __name__ == "__main__":
    main()