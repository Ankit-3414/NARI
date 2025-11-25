# modules/tasks.py
import argparse
from modules import utils

TASKS_FILE = utils.TASKS_FILE

def _load_tasks():
    data = utils.load_json(TASKS_FILE)
    return data.get("tasks", [])

def _save_tasks(tasks):
    data = {"tasks": tasks}
    utils.save_json(TASKS_FILE, data)

def add_task(argv):
    """add-task "title" -p priority -d yyyy-mm-dd"""
    parser = argparse.ArgumentParser(prog="add-task", add_help=False)
    parser.add_argument("title", nargs="+")  # Accept all words as title
    parser.add_argument("-p", "--priority", default="normal")
    parser.add_argument("-d", "--due", default=None)
    try:
        args = parser.parse_args(argv)
    except SystemExit:
        print("Usage: add-task \"title\" [-p priority] [-d yyyy-mm-dd]")
        return

    title = " ".join(args.title)  # Join words into one string
    priority = args.priority
    due = args.due

    tasks = _load_tasks()
    new_id = utils.next_id(tasks)
    item = {
        "id": new_id,
        "title": title,
        "priority": priority,
        "due": due,
        "status": "pending",
        "created": utils.timestamp()
    }
    tasks.append(item)
    _save_tasks(tasks)
    print(f"Task added: [{new_id}] {title}")

def list_tasks(argv=None):
    tasks = _load_tasks()
    # default view: active tasks (pending)
    pending = [t for t in tasks if t.get("status") != "completed"]
    utils.pretty_print_list("Active Tasks", pending)

def complete_task(argv):
    if not argv:
        print("Usage: complete-task <id>")
        return
    try:
        id_ = int(argv[0])
    except ValueError:
        print("Invalid id. Use integer.")
        return
    tasks = _load_tasks()
    found = False
    for t in tasks:
        if int(t.get("id", -1)) == id_:
            t["status"] = "completed"
            t["completed_at"] = utils.timestamp()
            found = True
            break
    if not found:
        print(f"No task with id {id_}")
        return
    _save_tasks(tasks)
    print(f"Task {id_} marked completed.")

def delete_task(argv):
    if not argv:
        print("Usage: delete-task <id>")
        return
    try:
        id_ = int(argv[0])
    except ValueError:
        print("Invalid id. Use integer.")
        return
    tasks = _load_tasks()
    new_tasks = [t for t in tasks if int(t.get("id", -1)) != id_]
    if len(new_tasks) == len(tasks):
        print(f"No task with id {id_}")
        return
    _save_tasks(new_tasks)
    print(f"Task {id_} deleted.")
