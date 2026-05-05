import importlib.util
import sys
from pathlib import Path

import pytest


CLI_PATH = Path(__file__).parents[2] / "cli" / "nari.py"


@pytest.fixture()
def cli_module():
    sys.path.insert(0, str(CLI_PATH.parent))
    spec = importlib.util.spec_from_file_location("nari_cli", CLI_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_cli(cli_module, argv, monkeypatch):
    monkeypatch.setattr("sys.argv", ["nari", *argv])
    cli_module.main()


def test_cli_edit_sends_patch_payload(cli_module, monkeypatch, capsys):
    calls = []

    def fake_request(method, path, payload=None):
        calls.append((method, path, payload))
        return {"ok": True, "data": {"id": 7, "title": "Updated"}, "error": None}

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(
        cli_module,
        ["edit", "7", "--title", "Updated", "--priority", "urgent"],
        monkeypatch,
    )

    assert calls == [
        ("PATCH", "/tasks/7", {"title": "Updated", "priority": "urgent"})
    ]
    assert "Updated #7: Updated" in capsys.readouterr().out


def test_cli_cancel_reopen_today_and_history(cli_module, monkeypatch, capsys):
    calls = []

    def fake_request(method, path, payload=None):
        calls.append((method, path, payload))
        if path.endswith("/history"):
            data = [
                {
                    "changed_at": "2026-05-05T10:00:00Z",
                    "action": "created",
                    "changed_by": "user",
                }
            ]
        elif path == "/tasks/today":
            data = [{"id": 2, "status": "pending", "priority": "high", "title": "A"}]
        else:
            data = {"id": 2, "title": "A"}
        return {"ok": True, "data": data, "error": None}

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["cancel", "2"], monkeypatch)
    run_cli(cli_module, ["reopen", "2"], monkeypatch)
    run_cli(cli_module, ["today"], monkeypatch)
    run_cli(cli_module, ["history", "2"], monkeypatch)

    assert calls == [
        ("DELETE", "/tasks/2", None),
        ("POST", "/tasks/2/reopen", None),
        ("GET", "/tasks/today", None),
        ("GET", "/tasks/2/history", None),
    ]
    output = capsys.readouterr().out
    assert "Cancelled #2: A" in output
    assert "Reopened #2: A" in output
    assert "#2 [pending/high] A" in output
    assert "created by user" in output


def test_cli_list_urlencodes_filters(cli_module, monkeypatch):
    calls = []

    def fake_request(method, path, payload=None):
        calls.append((method, path, payload))
        return {"ok": True, "data": [], "error": None}

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["list", "--tag", "math revision"], monkeypatch)

    assert calls == [("GET", "/tasks?tag=math+revision", None)]


def test_cli_list_hides_terminal_tasks_by_default(cli_module, monkeypatch, capsys):
    def fake_request(method, path, payload=None):
        return {
            "ok": True,
            "data": [
                {"id": 1, "status": "pending", "priority": "high", "title": "A"},
                {"id": 2, "status": "done", "priority": "high", "title": "B"},
            ],
            "error": None,
        }

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["list"], monkeypatch)
    output = capsys.readouterr().out

    assert "#1 [pending/high] A" in output
    assert "B" not in output


def test_cli_list_all_includes_terminal_tasks(cli_module, monkeypatch, capsys):
    def fake_request(method, path, payload=None):
        return {
            "ok": True,
            "data": [
                {"id": 1, "status": "pending", "priority": "high", "title": "A"},
                {"id": 2, "status": "done", "priority": "low", "title": "B"},
            ],
            "error": None,
        }

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["list", "--all"], monkeypatch)
    output = capsys.readouterr().out

    assert "#1 [pending/high] A" in output
    assert "#2 [done/low] B" in output


def test_cli_add_accepts_due_alias(cli_module, monkeypatch):
    calls = []

    def fake_request(method, path, payload=None):
        calls.append((method, path, payload))
        return {"ok": True, "data": {"id": 1, "title": "A"}, "error": None}

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["add", "A", "--due", "today"], monkeypatch)

    assert calls[0][0:2] == ("POST", "/tasks")
    assert calls[0][2]["due_date"] is not None


def test_cli_activity_prints_recent_entries(cli_module, monkeypatch, capsys):
    calls = []

    def fake_request(method, path, payload=None):
        calls.append((method, path, payload))
        return {
            "ok": True,
            "data": [
                {
                    "created_at": "2026-05-05T10:00:00Z",
                    "entity_type": "task",
                    "entity_id": 4,
                    "action": "completed",
                    "message": "Task completed",
                }
            ],
            "error": None,
        }

    monkeypatch.setattr(cli_module, "request", fake_request)

    run_cli(cli_module, ["activity", "--entity-type", "task", "--limit", "5"], monkeypatch)

    assert calls == [("GET", "/activity?entity_type=task&limit=5", None)]
    assert "task#4 completed - Task completed" in capsys.readouterr().out
