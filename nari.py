from modules import subjects, notes, tasks, utils
from modules.study_manager import StudyManager

def show_help():
    print(" subjects add <name>            - Add a new subject")
    print(" subjects remove <n>         - Remove a subject")
    print(" subjects list                  - List all subjects")
    print(" study start <subject>          - Start a study session")
    print(" study stop                     - Stop current session (prompts to save)")
    print(" study report [YYYY-MM-DD]      - Show daily study report (default: today)")
    print(" tasks add \"title\" [-p prio] [-d yyyy-mm-dd]  - Add a task")
    print(" tasks list                     - List active tasks")
    print(" tasks complete <id>            - Mark a task as completed")
    print(" tasks delete <id>              - Delete a task")
    print(" notes add \"text\"               - Add a quick note")
    print(" notes list                     - List all notes")
    print(" notes delete <id>              - Delete a note")
    print(" help                           - Show this help")
    print(" exit / quit                    - Exit NARI")

def handle_command(cmd, args):
    """Router for all modules"""
    # === SUBJECTS ===
    if cmd in ["subjects", "subject"]:
        subjects.handle_command(args)
    elif cmd in ["add", "remove", "list"]:
        subjects.handle_command([cmd] + args)

    # === STUDY ===
    elif cmd == "study":
        study_mgr = StudyManager()
        if not args:
            print("Usage: study [start/stop/report]")
            return
        sub = args[0].lower()
        sub_args = args[1:]
        if sub == "start" and sub_args:
            subject = " ".join(sub_args)
            session = study_mgr.start_session({"subject": subject})
            if session:
                print(f"Started study session for {subject}")
        elif sub == "stop":
            # TODO: Get current active session and stop it
            print("Stopping study session...")
        elif sub == "report":
            sessions = study_mgr.get_all_sessions()
            if sessions:
                print("\n=== Study Sessions ===")
                for session in sessions:
                    print(f"{session['date']} - {session['subject']}: {session.get('start_time', 'N/A')} to {session.get('end_time', 'N/A')}")
            else:
                print("No study sessions found")
        else:
            print("Unknown study command. Try: start, stop, report")

    # === TASKS ===
    elif cmd == "tasks":
        if not args:
            print("Usage: tasks [add/list/complete/delete]")
            return
        sub = args[0].lower()
        sub_args = args[1:]
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

    # === NOTES ===
    elif cmd == "notes":
        if not args:
            print("Usage: notes [add/list/delete]")
            return
        sub = args[0].lower()
        sub_args = args[1:]
        if sub == "add":
            notes.add_note(sub_args)
        elif sub == "list":
            notes.list_notes()
        elif sub == "delete":
            notes.delete_note(sub_args)
        else:
            print("Unknown notes command. Try: add, list, delete")

    # === HELP / EXIT ===
    elif cmd in ["help", "?"]:
        show_help()
    elif cmd in ["exit", "quit", "bye", "off"]:
        print(" Goodbye!")
        return "exit"
    else:
        print(" Unknown command. Try subjects, study, tasks, notes, help, or exit.")

def main():
    # Ensure data files exist
    utils.ensure_directories_and_files()
    
    print("\n Welcome to NARI - Your Study Assistant!")
    print("Type help for available commands")
    
    while True:
        try:
            raw = input("\n> ").strip()
            if not raw:
                continue
            parts = raw.split()
            cmd = parts[0].lower()
            args = parts[1:]
            result = handle_command(cmd, args)
            if result == "exit":
                break
        except KeyboardInterrupt:
            print("\n Goodbye!")
            break
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
