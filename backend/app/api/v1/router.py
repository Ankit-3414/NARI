"""API v1 router."""

from fastapi import APIRouter

from .activity import router as activity_router
from .ai import router as ai_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .context import router as context_router
from .goals import router as goals_router
from .habits import router as habits_router
from .health import router as health_router
from .locations import router as locations_router
from .notes import router as notes_router
from .reminders import router as reminders_router
from .settings import router as settings_router
from .study import router as study_router
from .subjects import router as subjects_router
from .tasks import router as tasks_router
from .utils import router as utils_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(subjects_router)
api_router.include_router(study_router)
api_router.include_router(notes_router)
api_router.include_router(tasks_router)
api_router.include_router(reminders_router)
api_router.include_router(goals_router)
api_router.include_router(habits_router)
api_router.include_router(analytics_router)
api_router.include_router(activity_router)
api_router.include_router(locations_router)
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])
api_router.include_router(settings_router)
api_router.include_router(context_router, prefix="/context", tags=["Context"])
api_router.include_router(utils_router, prefix="/utils", tags=["Utils"])
