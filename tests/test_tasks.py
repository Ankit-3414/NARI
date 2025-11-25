import importlib
import os
from modules import utils


def setup_tmp_utils(tmp_path):
    utils.DATA_DIR = str(tmp_path / "data")
    utils.LOGS_DIR = os.path.join(utils.DATA_DIR, "logs")
    utils.SUBJECTS_FILE = os.path.join(utils.DATA_DIR, "subjects.json")
    utils.TASKS_FILE = os.path.join(utils.DATA_DIR, "tasks.json")
    utils.NOTES_FILE = os.path.join(utils.DATA_DIR, "notes.json")
    importlib.reload(utils)


def test_add_and_complete_task(tmp_path, capsys):
    setup_tmp_utils(tmp_path)
    import modules.tasks as tasks
    importlib.reload(tasks)

    utils.ensure_directories_and_files()
    tasks.add_task(["Test task"])
    tasks.list_tasks()
    captured = capsys.readouterr()
    assert "Test task" in captured.out

    # complete the task
    tasks_list = tasks._load_tasks()
    tid = tasks_list[0]["id"]
    tasks.complete_task([str(tid)])
    captured2 = capsys.readouterr()
    assert f"Task {tid} marked completed." in captured2.out
