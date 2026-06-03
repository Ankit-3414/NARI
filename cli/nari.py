"""NARI CLI - thin HTTP client."""

import argparse

from nari_support import (
    clean,
    ensure_ok,
    normalize_due_date,
    parse_tags,
    print_tasks,
    query_suffix,
    request,
    task_line,
)


def add_task(args: argparse.Namespace) -> None:
    payload = {
        "title": args.title,
        "description": args.description,
        "priority": args.priority,
        "due_date": normalize_due_date(args.due_date),
        "tags": parse_tags(args.tags),
        "estimated_minutes": args.estimated_minutes,
        "recurrence_rule": args.recurrence,
    }
    data = ensure_ok(request("POST", "/tasks", clean(payload)))
    print(f"Added #{data['id']}: {data['title']}")


def list_tasks(args: argparse.Namespace) -> None:
    args.due_date = normalize_due_date(args.due_date)
    suffix = query_suffix(args, "status", "priority", "due_date", "tag")
    tasks = ensure_ok(request("GET", f"/tasks{suffix}"))
    if not args.all and not args.status:
        tasks = [task for task in tasks if task["status"] not in ("done", "cancelled")]
    print_tasks(tasks)


def today_tasks(args: argparse.Namespace) -> None:
    tasks = ensure_ok(request("GET", "/tasks/today"))
    print_tasks(tasks)


def view_task(args: argparse.Namespace) -> None:
    task = ensure_ok(request("GET", f"/tasks/{args.id}"))
    print(task_line(task))
    if task.get("description"):
        print(task["description"])
    if task.get("due_date"):
        print(f"Due: {task['due_date']}")
    if task.get("tags"):
        print(f"Tags: {', '.join(task['tags'])}")


def done_task(args: argparse.Namespace) -> None:
    task = ensure_ok(request("POST", f"/tasks/{args.id}/complete"))
    print(f"Done #{task['id']}: {task['title']}")


def edit_task(args: argparse.Namespace) -> None:
    payload = {
        "title": args.title,
        "description": args.description,
        "priority": args.priority,
        "status": args.status,
        "due_date": normalize_due_date(args.due_date),
        "tags": parse_tags(args.tags) if args.tags is not None else None,
        "estimated_minutes": args.estimated_minutes,
        "actual_minutes": args.actual_minutes,
    }
    task = ensure_ok(request("PATCH", f"/tasks/{args.id}", clean(payload)))
    print(f"Updated #{task['id']}: {task['title']}")


def cancel_task(args: argparse.Namespace) -> None:
    task = ensure_ok(request("DELETE", f"/tasks/{args.id}"))
    print(f"Cancelled #{task['id']}: {task['title']}")


def reopen_task(args: argparse.Namespace) -> None:
    task = ensure_ok(request("POST", f"/tasks/{args.id}/reopen"))
    print(f"Reopened #{task['id']}: {task['title']}")


def history_task(args: argparse.Namespace) -> None:
    rows = ensure_ok(request("GET", f"/tasks/{args.id}/history"))
    if not rows:
        print("No history.")
        return
    for row in rows:
        print(f"{row['changed_at']} {row['action']} by {row['changed_by']}")


def activity(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "entity_type", "entity_id", "limit")
    rows = ensure_ok(request("GET", f"/activity{suffix}"))
    if not rows:
        print("No activity.")
        return
    for row in rows:
        entity = row["entity_type"]
        if row.get("entity_id") is not None:
            entity = f"{entity}#{row['entity_id']}"
        print(f"{row['created_at']} {entity} {row['action']} - {row['message']}")


def add_subject(args: argparse.Namespace) -> None:
    payload = {
        "name": args.name,
        "description": args.description,
        "difficulty": args.difficulty,
        "priority": args.priority,
        "exam_date": normalize_due_date(args.exam_date),
        "tags": parse_tags(args.tags),
    }
    data = ensure_ok(request("POST", "/subjects", clean(payload)))
    print(f"Added subject #{data['id']}: {data['name']}")


def list_subjects(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "include_archived")
    subjects = ensure_ok(request("GET", f"/subjects{suffix}"))
    if not subjects:
        print("No subjects.")
        return
    for s in subjects:
        archived = " [ARCHIVED]" if s.get("archived_at") else ""
        print(f"#{s['id']} {s['name']} (diff:{s['difficulty'] or '?'}/prio:{s['priority']}){archived}")


def view_subject(args: argparse.Namespace) -> None:
    s = ensure_ok(request("GET", f"/subjects/{args.id}"))
    print(f"#{s['id']} {s['name']}")
    if s.get("description"):
        print(s["description"])
    print(f"Difficulty: {s['difficulty'] or '?'}")
    print(f"Priority: {s['priority']}")
    if s.get("exam_date"):
        print(f"Exam Date: {s['exam_date']}")
    if s.get("tags"):
        print(f"Tags: {', '.join(s['tags'])}")


def edit_subject(args: argparse.Namespace) -> None:
    payload = {
        "name": args.name,
        "description": args.description,
        "difficulty": args.difficulty,
        "priority": args.priority,
        "exam_date": normalize_due_date(args.exam_date),
        "tags": parse_tags(args.tags) if args.tags is not None else None,
    }
    s = ensure_ok(request("PATCH", f"/subjects/{args.id}", clean(payload)))
    print(f"Updated subject #{s['id']}: {s['name']}")


def archive_subject(args: argparse.Namespace) -> None:
    s = ensure_ok(request("DELETE", f"/subjects/{args.id}"))
    print(f"Archived subject #{s['id']}: {s['name']}")


def study_start(args: argparse.Namespace) -> None:
    payload = {"subject_id": args.subject_id, "goal_text": args.goal}
    data = ensure_ok(request("POST", "/study/start", clean(payload)))
    print(f"Started study session #{data['id']} for subject #{data['subject_id']}")
    if data["goal_text"]:
        print(f"Goal: {data['goal_text']}")


def study_pause(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", "/study/active/pause"))
    print(f"Paused session #{data['id']}. Duration so far: {data['duration_seconds']}s")


def study_resume(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", "/study/active/resume"))
    print(f"Resumed session #{data['id']}.")


def study_stop(args: argparse.Namespace) -> None:
    from urllib.parse import urlencode
    suffix = f"?{urlencode({'notes': args.notes})}" if args.notes else ""
    data = ensure_ok(request("POST", f"/study/active/stop{suffix}"))
    print(f"Stopped session #{data['id']}. Final duration: {data['duration_seconds']}s")
    if data["notes"]:
        print(f"Notes: {data['notes']}")


def study_status(args: argparse.Namespace) -> None:
    data = ensure_ok(request("GET", "/study/active"))
    if not data:
        print("No active study session.")
        return
    print(f"Session #{data['id']} [{data['status']}]")
    print(f"Subject ID: {data['subject_id']}")
    if data["goal_text"]:
        print(f"Goal: {data['goal_text']}")
    print(f"Duration: {data['duration_seconds']}s")
    print(f"Interruptions: {data['interrupt_count']}")


def study_list(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "subject_id", "limit")
    sessions = ensure_ok(request("GET", f"/study{suffix}"))
    if not sessions:
        print("No study sessions.")
        return
    for s in sessions:
        print(f"#{s['id']} Sub#{s['subject_id']} {s['created_at'][:16]} duration:{s['duration_seconds']}s")


def note_add(args: argparse.Namespace) -> None:
    payload = {
        "title": args.title,
        "content_markdown": args.content or "",
        "subject_id": args.subject_id,
        "tags": parse_tags(args.tags),
    }
    data = ensure_ok(request("POST", "/notes", clean(payload)))
    print(f"Added note #{data['id']}: {data['title']}")


def note_list(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "subject_id", "tag", "include_archived")
    notes = ensure_ok(request("GET", f"/notes{suffix}"))
    if not notes:
        print("No notes.")
        return
    for n in notes:
        archived = " [ARCHIVED]" if n.get("archived_at") else ""
        print(f"#{n['id']} {n['title']} (updated:{n['updated_at'][:10]}){archived}")


def note_view(args: argparse.Namespace) -> None:
    n = ensure_ok(request("GET", f"/notes/{args.id}"))
    print(f"#{n['id']} {n['title']}")
    print("-" * len(n["title"]))
    print(n["content_markdown"])
    print("-" * 10)
    if n.get("subject_id"):
        print(f"Subject: {n['subject_id']}")
    if n.get("tags"):
        print(f"Tags: {', '.join(n['tags'])}")


def note_edit(args: argparse.Namespace) -> None:
    payload = {
        "title": args.title,
        "content_markdown": args.content,
        "subject_id": args.subject_id,
        "tags": parse_tags(args.tags) if args.tags is not None else None,
        "change_note": args.msg,
    }
    n = ensure_ok(request("PATCH", f"/notes/{args.id}", clean(payload)))
    print(f"Updated note #{n['id']}: {n['title']}")


def note_archive(args: argparse.Namespace) -> None:
    n = ensure_ok(request("DELETE", f"/notes/{args.id}"))
    print(f"Archived note #{n['id']}: {n['title']}")


def note_history(args: argparse.Namespace) -> None:
    versions = ensure_ok(request("GET", f"/notes/{args.id}/versions"))
    if not versions:
        print("No versions found.")
        return
    for v in versions:
        print(f"v{v['version_number']} [{v['created_at'][:16]}] - {v['change_note'] or ''}")


def note_version(args: argparse.Namespace) -> None:
    v = ensure_ok(request("GET", f"/notes/{args.id}/versions/{args.v}"))
    print(f"#{args.id} v{v['version_number']} ({v['created_at']})")
    print("-" * 20)
    print(v["content_markdown"])


# Goal commands
def goal_add(args: argparse.Namespace) -> None:
    payload = {
        "title": args.title,
        "description": args.description,
        "scope": args.scope,
        "target_value": args.target,
        "due_date": normalize_due_date(args.due),
    }
    data = ensure_ok(request("POST", "/goals", clean(payload)))
    print(f"Added goal #{data['id']}: {data['title']}")


def goal_list(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "status", "scope")
    goals = ensure_ok(request("GET", f"/goals{suffix}"))
    if not goals:
        print("No goals.")
        return
    for g in goals:
        progress = f"({g['current_value']}/{g['target_value']})" if g['target_value'] else ""
        print(f"#{g['id']} [{g['status']}] {g['title']} {progress}")


def goal_progress(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", f"/goals/{args.id}/progress?increment={args.inc}"))
    print(f"Updated goal #{data['id']} progress: {data['current_value']}/{data['target_value']}")


# Habit commands
def habit_add(args: argparse.Namespace) -> None:
    payload = {
        "name": args.name,
        "description": args.description,
        "frequency": args.frequency,
        "target_count": args.target,
    }
    data = ensure_ok(request("POST", "/habits", clean(payload)))
    print(f"Added habit #{data['id']}: {data['name']}")


def habit_list(args: argparse.Namespace) -> None:
    habits = ensure_ok(request("GET", "/habits"))
    if not habits:
        print("No habits.")
        return
    for h in habits:
        print(f"#{h['id']} {h['name']} - Streak: {h['current_streak']} days")


def habit_done(args: argparse.Namespace) -> None:
    payload = {"note": args.note}
    data = ensure_ok(request("POST", f"/habits/{args.id}/complete", clean(payload)))
    print(f"Logged habit #{data['id']}: {data['name']}. Current streak: {data['streak_count']}")


# Reminder commands
def add_reminder(args: argparse.Namespace) -> None:
    # If sync is requested, we do the task creation first via the support request logic
    task_id = args.task_id
    if args.sync and not task_id:
        task_payload = {
            "title": args.title,
            "due_date": normalize_due_date(args.due),
            "recurrence_rule": args.repeat,
        }
        task_data = ensure_ok(request("POST", "/tasks", clean(task_payload)))
        task_id = task_data["id"]
        print(f"Created linked task #{task_id}")

    payload = {
        "title": args.title,
        "due_at": normalize_due_date(args.due),
        "repeat_rule": args.repeat,
        "task_id": task_id,
        "subject_id": args.subject_id,
    }
    data = ensure_ok(request("POST", "/reminders", clean(payload)))
    print(f"Added reminder #{data['id']}: {data['title']}")


def reminder_list(args: argparse.Namespace) -> None:
    suffix = query_suffix(args, "status")
    reminders = ensure_ok(request("GET", f"/reminders{suffix}"))
    if not reminders:
        print("No reminders.")
        return
    for r in reminders:
        print(f"#{r['id']} [{r['status']}] {r['title']} - {r['due_at']}")


def reminder_snooze(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", f"/reminders/{args.id}/snooze?minutes={args.min}"))
    print(f"Snoozed reminder #{data['id']} until {data['snoozed_until']}")


def reminder_dismiss(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", f"/reminders/{args.id}/dismiss"))
    print(f"Dismissed reminder #{data['id']}")


def tell_context(args: argparse.Namespace) -> None:
    ensure_ok(request("POST", "/context", {"text": args.text}))
    print("NARI: Logged.")


def digest_context(args: argparse.Namespace) -> None:
    data = ensure_ok(request("POST", "/context/digest"))
    concepts = data.get("concepts_learned", [])
    if not concepts:
        print("NARI: Digest completed. No new concepts learned.")
    else:
        print(f"NARI: Digest completed. Learned {len(concepts)} new concepts:")
        for c in concepts:
            print(f"  - {c}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="nari")
    sub = parser.add_subparsers(dest="command", required=True)
    
    tell = sub.add_parser("tell")
    tell.add_argument("text")
    tell.set_defaults(func=tell_context)

    digest = sub.add_parser("digest", help="Process and digest new context logs to extract semantic memories.")
    digest.set_defaults(func=digest_context)

    add = sub.add_parser("add")
    add.add_argument("title")
    add.add_argument("--description")
    add.add_argument("--priority", choices=["low", "normal", "high", "urgent"])
    add.add_argument("--due", "--due-date", dest="due_date")
    add.add_argument("--tags")
    add.add_argument("--estimated-minutes", type=int)
    add.add_argument("--recurrence", help="RRULE string (e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR)")
    add.set_defaults(func=add_task)

    list_cmd = sub.add_parser("list")
    list_cmd.add_argument("--status")
    list_cmd.add_argument("--priority")
    list_cmd.add_argument("--due", "--due-date", dest="due_date")
    list_cmd.add_argument("--tag")
    list_cmd.add_argument("--all", action="store_true")
    list_cmd.set_defaults(func=list_tasks)

    today = sub.add_parser("today")
    today.set_defaults(func=today_tasks)

    view = sub.add_parser("view")
    view.add_argument("id", type=int)
    view.set_defaults(func=view_task)

    done = sub.add_parser("done")
    done.add_argument("id", type=int)
    done.set_defaults(func=done_task)

    edit = sub.add_parser("edit")
    edit.add_argument("id", type=int)
    edit.add_argument("--title")
    edit.add_argument("--description")
    edit.add_argument("--priority", choices=["low", "normal", "high", "urgent"])
    edit.add_argument("--status", choices=["pending", "in_progress", "done", "cancelled"])
    edit.add_argument("--due", "--due-date", dest="due_date")
    edit.add_argument("--tags")
    edit.add_argument("--estimated-minutes", type=int)
    edit.add_argument("--actual-minutes", type=int)
    edit.set_defaults(func=edit_task)

    cancel = sub.add_parser("cancel")
    cancel.add_argument("id", type=int)
    cancel.set_defaults(func=cancel_task)

    reopen = sub.add_parser("reopen")
    reopen.add_argument("id", type=int)
    reopen.set_defaults(func=reopen_task)

    history = sub.add_parser("history")
    history.add_argument("id", type=int)
    history.set_defaults(func=history_task)

    activity_cmd = sub.add_parser("activity")
    activity_cmd.add_argument("--entity-type")
    activity_cmd.add_argument("--entity-id", type=int)
    activity_cmd.add_argument("--limit", type=int, default=20)
    activity_cmd.set_defaults(func=activity)

    # Subject commands
    sub_add = sub.add_parser("sub-add")
    sub_add.add_argument("name")
    sub_add.add_argument("--description")
    sub_add.add_argument("--difficulty", type=int)
    sub_add.add_argument("--priority", type=int, default=0)
    sub_add.add_argument("--exam-date")
    sub_add.add_argument("--tags")
    sub_add.set_defaults(func=add_subject)

    sub_list = sub.add_parser("sub-list")
    sub_list.add_argument("--all", dest="include_archived", action="store_true")
    sub_list.set_defaults(func=list_subjects)

    sub_view = sub.add_parser("sub-view")
    sub_view.add_argument("id", type=int)
    sub_view.set_defaults(func=view_subject)

    sub_edit = sub.add_parser("sub-edit")
    sub_edit.add_argument("id", type=int)
    sub_edit.add_argument("--name")
    sub_edit.add_argument("--description")
    sub_edit.add_argument("--difficulty", type=int)
    sub_edit.add_argument("--priority", type=int)
    sub_edit.add_argument("--exam-date")
    sub_edit.add_argument("--tags")
    sub_edit.set_defaults(func=edit_subject)

    sub_archive = sub.add_parser("sub-archive")
    sub_archive.add_argument("id", type=int)
    sub_archive.set_defaults(func=archive_subject)

    # Study commands
    stud_start = sub.add_parser("study-start")
    stud_start.add_argument("subject_id", type=int)
    stud_start.add_argument("--goal")
    stud_start.set_defaults(func=study_start)

    stud_pause = sub.add_parser("study-pause")
    stud_pause.set_defaults(func=study_pause)

    stud_resume = sub.add_parser("study-resume")
    stud_resume.set_defaults(func=study_resume)

    stud_stop = sub.add_parser("study-stop")
    stud_stop.add_argument("--notes")
    stud_stop.set_defaults(func=study_stop)

    stud_status = sub.add_parser("study-status")
    stud_status.set_defaults(func=study_status)

    stud_list = sub.add_parser("study-list")
    stud_list.add_argument("--subject-id", type=int)
    stud_list.add_argument("--limit", type=int, default=20)
    stud_list.set_defaults(func=study_list)

    # Note commands
    not_add = sub.add_parser("note-add")
    not_add.add_argument("title")
    not_add.add_argument("--content")
    not_add.add_argument("--subject-id", type=int)
    not_add.add_argument("--tags")
    not_add.set_defaults(func=note_add)

    not_list = sub.add_parser("note-list")
    not_list.add_argument("--subject-id", type=int)
    not_list.add_argument("--tag")
    not_list.add_argument("--all", dest="include_archived", action="store_true")
    not_list.set_defaults(func=note_list)

    not_view = sub.add_parser("note-view")
    not_view.add_argument("id", type=int)
    not_view.set_defaults(func=note_view)

    not_edit = sub.add_parser("note-edit")
    not_edit.add_argument("id", type=int)
    not_edit.add_argument("--title")
    not_edit.add_argument("--content")
    not_edit.add_argument("--subject-id", type=int)
    not_edit.add_argument("--tags")
    not_edit.add_argument("--msg", help="Change note/label for this version")
    not_edit.set_defaults(func=note_edit)

    not_archive = sub.add_parser("note-archive")
    not_archive.add_argument("id", type=int)
    not_archive.set_defaults(func=note_archive)

    not_history = sub.add_parser("note-history")
    not_history.add_argument("id", type=int)
    not_history.set_defaults(func=note_history)

    not_version = sub.add_parser("note-version")
    not_version.add_argument("id", type=int)
    not_version.add_argument("v", type=int, help="Version number")
    not_version.set_defaults(func=note_version)

    # Goal parsers
    g_add = sub.add_parser("goal-add")
    g_add.add_argument("title")
    g_add.add_argument("--description")
    g_add.add_argument("--scope", choices=["daily", "weekly", "monthly", "quarterly", "yearly"], default="weekly")
    g_add.add_argument("--target", type=int)
    g_add.add_argument("--due")
    g_add.set_defaults(func=goal_add)

    g_list = sub.add_parser("goal-list")
    g_list.add_argument("--status")
    g_list.add_argument("--scope")
    g_list.set_defaults(func=goal_list)

    g_prog = sub.add_parser("goal-inc")
    g_prog.add_argument("id", type=int)
    g_prog.add_argument("--inc", type=int, default=1)
    g_prog.set_defaults(func=goal_progress)

    # Habit parsers
    h_add = sub.add_parser("habit-add")
    h_add.add_argument("name")
    h_add.add_argument("--description")
    h_add.add_argument("--frequency", choices=["daily", "weekly"], default="daily")
    h_add.add_argument("--target", type=int, default=1)
    h_add.set_defaults(func=habit_add)

    h_list = sub.add_parser("habit-list")
    h_list.set_defaults(func=habit_list)

    h_done = sub.add_parser("habit-done")
    h_done.add_argument("id", type=int)
    h_done.add_argument("--note")
    h_done.set_defaults(func=habit_done)

    # Reminder parsers
    r_add = sub.add_parser("rem-add")
    r_add.add_argument("title")
    r_add.add_argument("--due", required=True, help="ISO datetime")
    r_add.add_argument("--repeat", help="RRULE string")
    r_add.add_argument("--task-id", type=int)
    r_add.add_argument("--subject-id", type=int)
    r_add.add_argument("--sync", action="store_true", help="Automatically create a linked task")
    r_add.set_defaults(func=add_reminder)

    r_list = sub.add_parser("rem-list")
    r_list.add_argument("--status")
    r_list.set_defaults(func=reminder_list)

    r_snooze = sub.add_parser("rem-snooze")
    r_snooze.add_argument("id", type=int)
    r_snooze.add_argument("--min", type=int, default=15)
    r_snooze.set_defaults(func=reminder_snooze)

    r_dismiss = sub.add_parser("rem-done")
    r_dismiss.add_argument("id", type=int)
    r_dismiss.set_defaults(func=reminder_dismiss)

    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
