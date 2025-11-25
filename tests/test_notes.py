import importlib
import os
from modules import utils


def setup_tmp_utils(tmp_path):
    # point utils to a temp data dir
    utils.DATA_DIR = str(tmp_path / "data")
    utils.LOGS_DIR = os.path.join(utils.DATA_DIR, "logs")
    utils.SUBJECTS_FILE = os.path.join(utils.DATA_DIR, "subjects.json")
    utils.TASKS_FILE = os.path.join(utils.DATA_DIR, "tasks.json")
    utils.NOTES_FILE = os.path.join(utils.DATA_DIR, "notes.json")
    importlib.reload(utils)


def test_add_and_list_note(tmp_path, capsys):
    setup_tmp_utils(tmp_path)
    import modules.notes as notes
    importlib.reload(notes)

    # ensure files/dirs are created
    utils.ensure_directories_and_files()

    # add a note
    notes.add_note(["Test note"])

    # list notes and capture output
    notes.list_notes()
    captured = capsys.readouterr()
    assert "Test note" in captured.out


def test_delete_note(tmp_path, capsys):
    setup_tmp_utils(tmp_path)
    import modules.notes as notes
    importlib.reload(notes)

    utils.ensure_directories_and_files()
    notes.add_note(["To be deleted"])
    # find id
    notes_list = notes._load_notes()
    nid = notes_list[0]["id"]

    notes.delete_note([str(nid)])
    # verify the deleted id is no longer present
    remaining = notes._load_notes()
    ids = [n.get("id") for n in remaining]
    assert nid not in ids
