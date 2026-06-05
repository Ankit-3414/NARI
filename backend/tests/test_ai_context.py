import pytest
from sqlmodel import Session
from app.ai.context_builder import context_builder
from app.models.task import Task
from app.models.goal import Goal
from app.models.habit import Habit
from app.models.reminder import Reminder
from app.core.constants import TaskPriority, TaskStatus, GoalStatus, GoalScope, HabitFrequency, ReminderStatus
from datetime import datetime, timezone, timedelta

def test_context_builder_includes_habits_goals_weather(session: Session):
    # 1. Setup a test task
    task = Task(
        title="Test Context Task", 
        priority=TaskPriority.HIGH, 
        status=TaskStatus.PENDING,
        due_date=datetime.now(timezone.utc).date()
    )
    session.add(task)

    # 2. Setup a test habit
    habit = Habit(
        name="Study AI Systems", 
        frequency=HabitFrequency.DAILY, 
        current_streak=12
    )
    session.add(habit)

    # 3. Setup a test goal
    goal = Goal(
        title="Pass Engineering Exams", 
        status=GoalStatus.ACTIVE, 
        current_value=4, 
        target_value=10, 
        scope=GoalScope.MONTHLY
    )
    session.add(goal)

    # 4. Setup a test reminder
    reminder = Reminder(
        title="Dinner with team",
        due_at=datetime.now(timezone.utc) + timedelta(hours=2),
        status=ReminderStatus.SCHEDULED,
        is_active=True
    )
    session.add(reminder)

    session.commit()

    # Build context window
    context = context_builder.build_context_window(session, current_query="Review schedule")

    # Assertions
    # Check Tasks
    assert "TODAY'S TASKS:" in context
    assert "Test Context Task" in context

    # Check Habits
    assert "ACTIVE HABITS:" in context
    assert "Study AI Systems" in context
    assert "Streak: 12 days" in context
    assert "Frequency: daily" in context

    # Check Goals
    assert "ACTIVE GOALS:" in context
    assert "Pass Engineering Exams" in context
    assert "Progress: 4/10" in context
    assert "Scope: monthly" in context
    assert "Status: active" in context

    # Check Reminders
    assert "ACTIVE REMINDERS:" in context
    assert "Dinner with team" in context
    assert "Status: scheduled" in context


from unittest.mock import AsyncMock, patch
import json
from app.services.context_service import context_service
from app.models.knowledge import KnowledgeNode
from app.services.user_service import user_service

@pytest.mark.anyio
async def test_context_digestion_service_flow(session: Session):
    from app.models.activity_log import ActivityLog
    from app.core.constants import EntityType
    import sqlalchemy as sa
    
    # Manually create the sqlite-vec virtual table for test DB (not tracked by SQLModel metadata)
    session.execute(sa.text("CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_nodes_vec USING vec0(embedding float[384]);"))
    session.commit()
    
    # 1. Log raw context entries directly to session (bypass async EventBus latency)
    log1 = ActivityLog(
        entity_type=EntityType.CONTEXT,
        entity_id=0,
        action="logged",
        message="Ankit prefers drinking cold brew coffee with milk.",
        payload_json=json.dumps({"text": "Ankit prefers drinking cold brew coffee with milk."}),
        source="test"
    )
    log2 = ActivityLog(
        entity_type=EntityType.CONTEXT,
        entity_id=0,
        action="logged",
        message="NARI is built on Python 3.12 and FastAPI.",
        payload_json=json.dumps({"text": "NARI is built on Python 3.12 and FastAPI."}),
        source="test"
    )
    session.add(log1)
    session.add(log2)
    session.commit()
    
    # 2. Mock NIM LLM client responses
    mock_choice = AsyncMock()
    mock_choice.message.content = json.dumps([
        {"concept": "Coffee Preference", "summary": "Ankit prefers cold brew coffee with milk.", "confidence": 0.95},
        {"concept": "NARI Architecture", "summary": "NARI is built using Python 3.12 and FastAPI.", "confidence": 1.0}
    ])
    
    mock_response = AsyncMock()
    mock_response.choices = [mock_choice]
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    
    # Mock the LLM client so we don't hit the live endpoint
    with patch("app.ai.llm_client.nim_client._get_client", return_value=mock_client):
        # 3. Trigger context logs digestion
        concepts = await context_service.digest_context(session)
        
        # 4. Assertions
        assert "Coffee Preference" in concepts
        assert "NARI Architecture" in concepts
        
        # Check database stores the knowledge nodes
        from sqlmodel import select
        nodes = list(session.exec(select(KnowledgeNode)).all())
        assert len(nodes) == 2
        
        concepts_in_db = [n.concept for n in nodes]
        assert "Coffee Preference" in concepts_in_db
        assert "NARI Architecture" in concepts_in_db
        
        # Verify user preference cursor was updated to prevent double digestion
        user = user_service.get_default_user(session)
        prefs = json.loads(user.preferences_json) if user.preferences_json else {}
        assert prefs.get("last_digested_context_id") > 0
        
        # Verify subsequent digest calls with no new logs return empty list
        with patch("app.ai.llm_client.nim_client._get_client", return_value=mock_client) as mock_get:
            empty_concepts = await context_service.digest_context(session)
            assert empty_concepts == []
            # Verify the LLM client was not called again
            mock_get.assert_not_called()


from app.core.events import setup_event_listeners
import anyio

@pytest.mark.anyio
async def test_auto_context_digestion_on_event(session: Session):
    # Register listeners
    setup_event_listeners()
    import sqlalchemy as sa
    
    # Ensure virtual table is created
    session.execute(sa.text("CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_nodes_vec USING vec0(embedding float[384]);"))
    session.commit()

    # Setup mock client
    mock_choice = AsyncMock()
    mock_choice.message.content = json.dumps([
        {"concept": "Automatic Ingestion", "summary": "NARI now learns automatically in the background.", "confidence": 0.9}
    ])
    
    mock_response = AsyncMock()
    mock_response.choices = [mock_choice]
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    
    # Mock the LLM client so background task doesn't hit live endpoints
    with patch("app.ai.llm_client.nim_client._get_client", return_value=mock_client):
        # 1. Trigger context log event
        await context_service.log_context("NARI must learn automatically without manual work.", source="test")
        
        # 2. Yield control to the async loop for 1.5 seconds to let the background listener run
        await anyio.sleep(1.5)
        
        # 3. Assert NARI successfully digested the log in the background
        from sqlmodel import select
        nodes = list(session.exec(select(KnowledgeNode)).all())
        assert len(nodes) == 1
        assert nodes[0].concept == "Automatic Ingestion"
        assert nodes[0].summary == "NARI now learns automatically in the background."


@pytest.mark.anyio
async def test_crud_tool_execution(session: Session):
    from app.ai.tools import tool_registry
    
    # 1. Test create_note
    result = await tool_registry.execute_tool(session, "create_note", {
        "title": "Test AI Note",
        "content_markdown": "This note was created by the AI copilot."
    })
    assert "Successfully created note" in result
    
    # Verify note in DB
    from app.models.note import Note
    from sqlmodel import select
    note = session.exec(select(Note).where(Note.title == "Test AI Note")).first()
    assert note is not None
    assert note.content_markdown == "This note was created by the AI copilot."
    
    # 2. Test update_note
    result = await tool_registry.execute_tool(session, "update_note", {
        "note_id": note.id,
        "title": "Updated AI Note",
        "content_markdown": "Note is now updated."
    })
    assert "Successfully updated note" in result
    session.refresh(note)
    assert note.title == "Updated AI Note"
    assert note.content_markdown == "Note is now updated."
    
    # 3. Test delete_note
    result = await tool_registry.execute_tool(session, "delete_note", {
        "note_id": note.id
    })
    assert "Successfully deleted/archived note" in result
    session.refresh(note)
    assert note.archived_at is not None
    
    # 4. Test create_reminder
    result = await tool_registry.execute_tool(session, "create_reminder", {
        "title": "AI Reminder",
        "due_at": "2026-06-05T08:00:00Z"
    })
    assert "Successfully created reminder" in result
    from app.models.reminder import Reminder
    reminder = session.exec(select(Reminder).where(Reminder.title == "AI Reminder")).first()
    assert reminder is not None
    assert reminder.due_at.isoformat().startswith("2026-06-05T08:00:00")
    
    # 5. Test dismiss_reminder
    result = await tool_registry.execute_tool(session, "dismiss_reminder", {
        "reminder_id": reminder.id
    })
    assert "Successfully dismissed reminder" in result
    session.refresh(reminder)
    from app.core.constants import ReminderStatus
    assert reminder.status == ReminderStatus.DISMISSED

    # 5.1 Test lock_in_reminder
    result = await tool_registry.execute_tool(session, "create_reminder", {
        "title": "Lock In Reminder",
        "due_at": "2026-06-05T09:00:00Z"
    })
    assert "Successfully created reminder" in result
    reminder2 = session.exec(select(Reminder).where(Reminder.title == "Lock In Reminder")).first()
    assert reminder2 is not None
    
    result = await tool_registry.execute_tool(session, "lock_in_reminder", {
        "reminder_id": reminder2.id
    })
    assert "Successfully locked in reminder" in result
    session.refresh(reminder2)
    assert reminder2.is_locked_in is True
    
    # 5.2 Test skip_reminder
    result = await tool_registry.execute_tool(session, "skip_reminder", {
        "reminder_id": reminder2.id
    })
    assert "Successfully skipped reminder" in result
    session.refresh(reminder2)
    assert reminder2.status == ReminderStatus.SKIPPED
    
    # 5.3 Test snooze_reminder
    result = await tool_registry.execute_tool(session, "snooze_reminder", {
        "reminder_id": reminder2.id,
        "minutes": 10
    })
    assert "Successfully snoozed reminder" in result
    session.refresh(reminder2)
    assert reminder2.status == ReminderStatus.SNOOZED
    assert reminder2.snoozed_until is not None
    
    # 6. Test create_habit
    result = await tool_registry.execute_tool(session, "create_habit", {
        "name": "Exercise",
        "frequency": "daily"
    })
    assert "Successfully created habit" in result
    from app.models.habit import Habit
    habit = session.exec(select(Habit).where(Habit.name == "Exercise")).first()
    assert habit is not None
    
    # 7. Test delete_habit
    result = await tool_registry.execute_tool(session, "delete_habit", {
        "habit_id": habit.id
    })
    assert "Successfully deleted habit" in result
    deleted_habit = session.get(Habit, habit.id)
    assert deleted_habit is None


@pytest.mark.anyio
async def test_web_search_tool_execution(session: Session):
    from app.ai.tools import tool_registry
    
    with patch("app.ai.tools.perform_web_search", return_value="1. Test Search Result\n   URL: http://example.com\n   Summary: Example result") as mock_search:
        result = await tool_registry.execute_tool(session, "web_search", {
            "query": "pytest test query"
        })
        assert "Test Search Result" in result
        mock_search.assert_called_once_with("pytest test query")


@pytest.mark.anyio
async def test_expanded_crud_tools(session: Session):
    from app.ai.tools import tool_registry
    from app.models.task import Task
    from app.models.subject import Subject
    from app.models.goal import Goal
    from app.models.habit import Habit
    from app.core.constants import TaskPriority, TaskStatus, GoalScope, HabitFrequency
    from sqlmodel import select

    # 1. Test update_task
    task = Task(title="Test Update Task", priority=TaskPriority.NORMAL, status=TaskStatus.PENDING)
    session.add(task)
    session.commit()
    
    result = await tool_registry.execute_tool(session, "update_task", {
        "task_id": task.id,
        "priority": "high",
        "status": "done"
    })
    assert "updated successfully" in result
    session.refresh(task)
    assert task.priority == TaskPriority.HIGH
    assert task.status == TaskStatus.DONE

    # 2. Test create_subject & list_subjects
    result = await tool_registry.execute_tool(session, "create_subject", {
        "name": "Maths",
        "description": "Calculus studies",
        "difficulty": 3
    })
    assert "Subject 'Maths' created successfully" in result
    
    subj = session.exec(select(Subject).where(Subject.name == "Maths")).first()
    assert subj is not None
    assert subj.difficulty == 3

    # 3. Test start/stop study session
    result = await tool_registry.execute_tool(session, "start_study_session", {
        "subject_id": subj.id,
        "goal_text": "Understand integrals"
    })
    assert "Study session started successfully" in result
    
    # 4. Test create_goal & update_goal
    # 4. Test create_goal & update_goal & increment_goal_progress
    result = await tool_registry.execute_tool(session, "create_goal", {
        "title": "Build a compiler",
        "target_value": 5,
        "scope": "yearly"
    })
    assert "created successfully" in result
    goal = session.exec(select(Goal).where(Goal.title == "Build a compiler")).first()
    assert goal is not None
    
    result = await tool_registry.execute_tool(session, "update_goal", {
        "goal_id": goal.id,
        "current_value": 2
    })
    assert "Goal" in result
    session.refresh(goal)
    assert goal.current_value == 2

    result = await tool_registry.execute_tool(session, "increment_goal_progress", {
        "goal_id": goal.id,
        "increment": 2
    })
    assert "incremented" in result
    session.refresh(goal)
    assert goal.current_value == 4

    # 5. Test complete_habit & get_habit_logs
    habit = Habit(name="Read books", frequency=HabitFrequency.DAILY)
    session.add(habit)
    session.commit()
    result = await tool_registry.execute_tool(session, "complete_habit", {
        "habit_id": habit.id,
        "note": "Read Chapter 1"
    })
    assert "Logged completion" in result
    session.refresh(habit)
    assert habit.current_streak == 1

    result = await tool_registry.execute_tool(session, "get_habit_logs", {
        "habit_id": habit.id,
        "limit": 5
    })
    assert "Recent logs for habit" in result
    assert "Read Chapter 1" in result

    # 6. Test get_activity_log
    from app.models.activity_log import ActivityLog
    from app.core.constants import EntityType
    log = ActivityLog(
        entity_type=EntityType.TASK,
        entity_id=1,
        action="created",
        message="Created test task",
        source="test"
    )
    session.add(log)
    session.commit()

    result = await tool_registry.execute_tool(session, "get_activity_log", {
        "limit": 5
    })
    assert "Recent Activity Logs" in result


@pytest.mark.anyio
async def test_ai_chat_endpoint_with_history(client, monkeypatch):
    from app.core.config import settings
    # Enable AI for this test
    monkeypatch.setattr(settings, "AI_ENABLED", True)

    mock_chat_response = {
        "text": "Sure, I remember our conversation, Sir.",
        "status": "success"
    }

    # Mock the nim_client.chat method
    from app.ai.llm_client import nim_client
    with patch.object(nim_client, "chat", AsyncMock(return_value=mock_chat_response)) as mock_chat:
        history = [
            {"role": "user", "content": "My favorite color is blue."},
            {"role": "assistant", "content": "I will remember that your favorite color is blue, Sir."}
        ]
        
        response = client.post(
            "/api/v1/ai/chat",
            headers={"Authorization": f"Bearer {settings.NARI_API_KEY}"},
            json={
                "message": "What is my favorite color?",
                "history": history
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["data"]["text"] == "Sure, I remember our conversation, Sir."
        
        # Verify the history was passed correctly to the mocked chat method
        mock_chat.assert_called_once()
        args, kwargs = mock_chat.call_args
        
        called_history = kwargs.get("history")
        assert called_history is not None
        assert len(called_history) == 2
        assert called_history[0].role == "user"
        assert called_history[0].content == "My favorite color is blue."
        assert called_history[1].role == "assistant"
        assert called_history[1].content == "I will remember that your favorite color is blue, Sir."


@pytest.mark.anyio
async def test_get_server_health_tool(session: Session):
    from app.ai.tools import tool_registry
    
    result = await tool_registry.execute_tool(session, "get_server_health", {})
    assert "NARI SYSTEM HEALTH & SERVER TELEMETRY REPORT" in result
    assert "Host OS" in result
    assert "Python Version" in result
    assert "SQLite Database Health" in result
    assert "Database Table Record Metrics" in result
    assert "Total Activity Logs" in result


@pytest.mark.anyio
async def test_run_server_cleanup_tool(session: Session):
    from app.ai.tools import tool_registry
    
    result = await tool_registry.execute_tool(session, "run_server_cleanup", {})
    assert "NARI SYSTEM CLEANUP & SELF-HEALING COMPLETE" in result
    assert "SQLite Database Optimizer" in result
    assert "Vacuum Executed: `True`" in result
    assert "DB Integrity Status: `ok`" in result
    assert "Host Temp File Cleaner" in result
