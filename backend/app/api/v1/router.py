"""API v1 router."""

from fastapi import APIRouter

from .activity import router as activity_router
from .health import router as health_router
from .notes import router as notes_router
from .subjects import router as subjects_router
from .study import router as study_router
from .tasks import router as tasks_router
from .reminders import router as reminders_router
from .goals import router as goals_router
from .habits import router as habits_router
from .analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(subjects_router)
api_router.include_router(study_router)
api_router.include_router(notes_router)
api_router.include_router(tasks_router)
api_router.include_router(reminders_router)
api_router.include_router(goals_router)
api_router.include_router(habits_router)
api_router.include_router(analytics_router)
api_router.include_router(activity_router)
