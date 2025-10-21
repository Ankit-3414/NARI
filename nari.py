# nari.py (v0.2 Phase 1 unified CLI)
import random
from modules import subjects, study, utils
from modules import tasks, notes

# ensure data structure exists before anything else
utils.ensure_directories_and_files()

def greet():
    greetings = [
        "Hey! Ready to study?",
        "👋 Welcome back!",
        "Let's get productive! 🚀",
        "Time to focus!",
        "Hello! What shall we tackle today?"
    ]
    print(random.choice(greetings))

def show_help():
    print("\n🛠️  NARI Commands:")
    print(" subjects add <name>            - Add a new subject")
    print(" subjects remove <name>         - Remove a subject")
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
        study.handle_command(args, subjects.load_subjects)

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
        print("👋 Goodbye!")
        return "exit"
    else:
        print("❓ Unknown command. Try 'subjects', 'study', 'tasks', 'notes', 'help', or 'exit'.")

def main():
    greet()
    while True:
        raw = input("\n> ").strip()
        if not raw:
            continue
        parts = raw.split()
        cmd = parts[0].lower()
        args = parts[1:]
        result = handle_command(cmd, args)
        if result == "exit":
            break

if __name__ == "__main__":
    main()
