import argparse
import threading
import requests
import time
import sys

from modules import subjects, notes, tasks, utils
from modules.study_manager import StudyManager
from app import app, socketio

server_thread = None
server_running = False

def show_help():
    print("\n=== NARI CLI Commands ===")
    print(" subjects add <name>                  - Add a new subject")
    print(" subjects remove <n>                  - Remove a subject")
    print(" subjects list                        - List all subjects")
    print(" study start <subject>                - Start a study session")
    print(" study stop                           - Stop current session (prompts to save)")
    print(" study report [YYYY-MM-DD]            - Show daily study report (default: today)")
    print(" tasks add \"title\" [-p prio] [-d date] - Add a task")
    print(" tasks list                           - List active tasks")
    print(" tasks complete <id>                  - Mark a task as completed")
    print(" tasks delete <id>                    - Delete a task")
    print(" notes add \"text\"                     - Add a quick note")
    print(" notes list                           - List all notes")
    print(" notes delete <id>                    - Delete a note")
    print(" help                                 - Show this help")
    print(" exit / quit                          - Exit NARI")

def handle_command(cmd, args):
    if cmd in ["subjects", "subject"]:
        subjects.handle_command(args)
    elif cmd in ["add", "remove", "list"]:
        subjects.handle_command([cmd] + args)
    elif cmd == "study":
        study_mgr = StudyManager()
        if not args:
            print("Usage: study [start/stop/report]")
            return
        sub, sub_args = args[0].lower(), args[1:]
        if sub == "start" and sub_args:
            subject = " ".join(sub_args)
            session = study_mgr.start_session({"subject": subject})
            if session:
                print(f"Started study session for {subject}")
        elif sub == "stop":
            print("Stopping study session...")  # TODO: Implement session stop logic
        elif sub == "report":
            sessions = study_mgr.get_all_sessions()
            if sessions:
                print("\n=== Study Sessions ===")
                for s in sessions:
                    print(f"{s['date']} - {s['subject']}: {s.get('start_time', 'N/A')} to {s.get('end_time', 'N/A')}")
            else:
                print("No study sessions found")
        else:
            print("Unknown study command. Try: start, stop, report")
    elif cmd == "tasks":
        if not args:
            print("Usage: tasks [add/list/complete/delete]")
            return
        sub, sub_args = args[0].lower(), args[1:]
        if sub == "add":
            tasks.add_task(sub_args)
        elif sub == "list":
            tasks.list_tasks()
        elif sub == "complete":
            tasks.complete_task(sub_args)
        elif sub == "delete":
            tasks.delete_task(sub_args)
        else:
            print("Unknown tasks command. Try: add, list, complete, delete")
    elif cmd == "notes":
        if not args:
            print("Usage: notes [add/list/delete]")
            return
        sub, sub_args = args[0].lower(), args[1:]
        if sub == "add":
            notes.add_note(sub_args)
        elif sub == "list":
            notes.list_notes()
        elif sub == "delete":
            notes.delete_note(sub_args)
        else:
            print("Unknown notes command. Try: add, list, delete")
    elif cmd in ["help", "?"]:
        show_help()
    elif cmd in ["exit", "quit", "bye", "off"]:
        return "exit"
    else:
        print("Unknown command. Try subjects, study, tasks, notes, help, or exit.")

def run_server():
    def start():
        print("Starting NARI server on http://localhost:5000")
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)

    global server_thread, server_running
    server_thread = threading.Thread(target=start, daemon=True)
    server_thread.start()
    server_running = True
    time.sleep(1)  # Give server time to start

def stop_server():
    global server_thread, server_running
    if server_thread and server_thread.is_alive():
        print("Stopping server...")
        server_running = False
        # Server will stop when main thread exits (daemon thread)
    else:
        print("Server is not running.")

def check_server_status():
    urls = ["http://0.0.0.0:5000", "http://127.0.0.1:5000"]
    for url in urls:
        try:
            response = requests.get(url, timeout=2)
            if response.status_code in [200, 404]:
                print(f"✅ Server is running at {url}")
                return
        except requests.exceptions.RequestException:
            continue
    print("❌ Server is not running.")

def restart_server():
    stop_server()
    time.sleep(1)
    run_server()
    print("🔄 Server restarted.")

def run_cli():
    utils.ensure_directories_and_files()
    print("\nWelcome to NARI - Your Study Assistant!")
    print("Type 'help' for available commands")
    while True:
        try:
            raw = input("\n> ").strip()
            if not raw:
                continue
            parts = raw.split()
            cmd, args = parts[0].lower(), parts[1:]
            result = handle_command(cmd, args)
            if result == "exit":
                confirm = input("Do you want to stop the server too? (y/n): ").strip().lower()
                if confirm == "y":
                    stop_server()
                else:
                    print("Server will keep running in the background.")
                print("Goodbye!")
                break
        except KeyboardInterrupt:
            print("\nInterrupted. Type 'exit' to quit.")
        except Exception as e:
            print(f"Error: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="NARI - Study Assistant CLI + Server")
    parser.add_argument("--cli", action="store_true", help="Run NARI in CLI mode")
    parser.add_argument("--server", action="store_true", help="Start NARI web server")
    parser.add_argument("--status", action="store_true", help="Check if server is running")
    parser.add_argument("--restart", action="store_true", help="Restart the server")
    args = parser.parse_args()

    if args.status:
        check_server_status()
    if args.restart:
        restart_server()
    if args.server and args.cli:
        run_server()
        run_cli()
    elif args.server:
        run_server()
        print("Press Ctrl+C to stop the server.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nServer stopped.")
    elif args.cli:
        run_cli()
    if not any([args.cli, args.server, args.status, args.restart]):
        print("No mode specified. Use --cli, --server, --status, or --restart.")

if __name__ == "__main__":
    main()