
# nari.py (modular launcher)
import random
from modules import subjects, study

def greet():
    greetings = [
        "Hey! Ready to study?",
        "👋 Welcome back!",
        "Let's get productive!",
        "Time to focus! 🚀",
        "Hello! What shall we tackle today?"
    ]
    print(random.choice(greetings))

def show_help():
    print("\n🛠️  NARI Commands:")
    print(" subjects add <name>       - Add a new subject")
    print(" subjects remove <name>    - Remove a subject")
    print(" subjects list             - List all subjects")
    print(" study start <subject>     - Start a study session")
    print(" study stop                - Stop current session (prompts to save)")
    print(" study report [YYYY-MM-DD] - Show daily study report (default: today)")
    print(" help                      - Show help")
    print(" exit / quit               - Exit NARI")

def main():
    greet()
    while True:
        raw = input("\n> ").strip()
        if not raw:
            continue

        parts = raw.split()
        cmd = parts[0].lower()
        args = parts[1:]

        # legacy single-word subject commands (keeps old UX)
        if cmd in ["add", "remove", "list"]:
            # treat as subjects commands
            subjects.handle_command([cmd] + args)
            continue

        # module-prefixed commands e.g. "subjects add ...", "study start ..."
        if cmd in ["subjects", "subject"]:
            subjects.handle_command(args)
        elif cmd == "study":
            # pass subjects.load_subjects so study can validate without importing circularly
            study.handle_command(args, subjects.load_subjects)
        elif cmd in ["help", "?"]:
            show_help()
        elif cmd in ["exit", "quit", "bye", "off"]:
            print("👋 Goodbye!")
            break
        else:
            print("❓ Unknown command. Try 'subjects', 'study', 'help' or 'exit'.")

if __name__ == "__main__":
    main()
