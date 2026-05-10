import random
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from app.db.session import engine
from app.models.subject import Subject
from app.models.task import Task
from app.models.study_session import StudySession, StudySessionStatus
from app.models.activity_log import ActivityLog
from app.core.constants import TaskPriority, TaskStatus

def seed_data():
    with Session(engine) as session:
        # 1. Ensure subjects exist
        subjects = session.exec(select(Subject)).all()
        if not subjects:
            s1 = Subject(name="Neural Net", color="#00F2FF")
            s2 = Subject(name="Bio-Optimization", color="#FF0055")
            s3 = Subject(name="Deep Work", color="#9D00FF")
            session.add_all([s1, s2, s3])
            session.commit()
            subjects = [s1, s2, s3]

        print(f"Seeding analytics data for {len(subjects)} subjects...")

        now = datetime.now(UTC)
        
        # 2. Generate 30 days of data
        for i in range(30):
            day = now - timedelta(days=i)
            
            # Tasks for this day
            num_tasks = random.randint(2, 6)
            for _ in range(num_tasks):
                status = TaskStatus.DONE if random.random() > 0.3 else TaskStatus.PENDING
                priority = random.choice(list(TaskPriority))
                sub = random.choice(subjects)
                
                # Vary the hour to test temporal performance
                hour = random.choice([8, 9, 10, 11, 14, 15, 16, 20, 21])
                task_time = day.replace(hour=hour, minute=random.randint(0, 59), second=0, microsecond=0)
                
                task = Task(
                    title=f"Synthetic Task {random.randint(100, 999)}",
                    status=status,
                    priority=priority,
                    subject_id=sub.id,
                    created_at=task_time - timedelta(hours=2),
                    updated_at=task_time,
                    completed_at=task_time if status == TaskStatus.DONE else None
                )
                session.add(task)
                session.flush()
                
                # Activity log for creation
                session.add(ActivityLog(
                    entity_type="task",
                    entity_id=task.id,
                    action="created",
                    message=f"Created task: {task.title}",
                    created_at=task_time - timedelta(hours=2),
                    updated_at=task_time - timedelta(hours=2)
                ))
                
                if status == TaskStatus.DONE:
                    session.add(ActivityLog(
                        entity_type="task",
                        entity_id=task.id,
                        action="completed",
                        message=f"Completed task: {task.title}",
                        created_at=task_time,
                        updated_at=task_time
                    ))

            # Study sessions for this day
            if random.random() > 0.4:
                num_sessions = random.randint(1, 3)
                for _ in range(num_sessions):
                    sub = random.choice(subjects)
                    duration = random.randint(1800, 7200) # 30m to 2h
                    hour = random.choice([9, 10, 14, 15, 21])
                    start_time = day.replace(hour=hour, minute=0, second=0, microsecond=0)
                    
                    study = StudySession(
                        subject_id=sub.id,
                        status=StudySessionStatus.COMPLETED,
                        started_at=start_time,
                        ended_at=start_time + timedelta(seconds=duration),
                        duration_seconds=duration,
                        interruptions=random.randint(0, 3)
                    )
                    session.add(study)
                    session.flush()
                    
                    session.add(ActivityLog(
                        entity_type="study_session",
                        entity_id=study.id,
                        action="started",
                        message=f"Started study session for {sub.name}",
                        created_at=start_time,
                        updated_at=start_time
                    ))
                    session.add(ActivityLog(
                        entity_type="study_session",
                        entity_id=study.id,
                        action="stopped",
                        message=f"Stopped study session for {sub.name}",
                        created_at=start_time + timedelta(seconds=duration),
                        updated_at=start_time + timedelta(seconds=duration)
                    ))

        session.commit()
        print("Neural dataset injection complete.")

if __name__ == "__main__":
    seed_data()
