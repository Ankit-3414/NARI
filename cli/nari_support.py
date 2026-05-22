"""Shared helpers for the NARI CLI."""

import json
import os
import sys
from datetime import date, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API_URL = os.getenv("NARI_API_URL", "http://localhost:8000/api/v1")
API_KEY = os.getenv("NARI_API_KEY")

if not API_KEY:
    print("Error: NARI_API_KEY environment variable is not set.", file=sys.stderr)
    sys.exit(1)


def request(method: str, path: str, payload: dict | None = None) -> dict:
    body = None
    headers = {"Authorization": f"Bearer {API_KEY}"}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = Request(f"{API_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return error(f"HTTP {exc.code}: {body}")
    except URLError as exc:
        return error(f"Cannot reach NARI API: {exc.reason}")


def error(message: str) -> dict:
    return {"ok": False, "data": None, "error": {"code": "CLI_ERROR", "message": message}}


def ensure_ok(response: dict) -> dict:
    if response.get("ok"):
        return response["data"]
    err = response.get("error", {})
    message = err.get("message", "Unknown error")
    code = err.get("code")
    prefix = f"{code}: " if code else ""
    print(f"Error: {prefix}{message}", file=sys.stderr)
    raise SystemExit(1)


def print_tasks(tasks: list[dict]) -> None:
    if not tasks:
        print("No tasks.")
        return
    for task in sorted(tasks, key=task_sort_key):
        print(task_line(task))


def task_line(task: dict) -> str:
    due = f" due:{task['due_date']}" if task.get("due_date") else ""
    priority = task.get("priority", "normal")
    return f"#{task['id']} [{task['status']}/{priority}] {task['title']}{due}"


def task_sort_key(task: dict) -> tuple:
    due = task.get("due_date") or "9999-12-31"
    priority_rank = {"urgent": 0, "high": 1, "normal": 2, "low": 3}
    return (due, priority_rank.get(task.get("priority"), 4), task["id"])


def parse_tags(tags: str | None) -> list[str] | None:
    if not tags:
        return None
    return [tag.strip() for tag in tags.split(",") if tag.strip()]


def normalize_due_date(value: str | None) -> str | None:
    if value is None:
        return None
    lowered = value.lower()
    if lowered == "today":
        return date.today().isoformat()
    if lowered == "tomorrow":
        return (date.today() + timedelta(days=1)).isoformat()
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        print("Error: due date must be today, tomorrow, or YYYY-MM-DD", file=sys.stderr)
        raise SystemExit(1)


def query_suffix(args, *keys: str) -> str:
    values = {key: getattr(args, key) for key in keys if getattr(args, key)}
    return f"?{urlencode(values)}" if values else ""


def clean(payload: dict) -> dict:
    return {key: value for key, value in payload.items() if value is not None}
