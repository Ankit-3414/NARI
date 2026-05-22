"""Stage 0 health and version endpoints."""

import datetime
from fastapi import APIRouter, Depends

from ...core.config import settings
from ...core.security import verify_api_key
from ...db.session import check_database
from ...schemas.common import success_response

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.get("/health")
def health_check():
    """Return API and database health including current server time."""
    check_database()
    return success_response({
        "status": "healthy", 
        "database": "ok",
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })


@router.get("/version")
def version():
    """Return Stage 0 version metadata."""
    return success_response(
        {
            "app": settings.NARI_APP_NAME,
            "version": settings.NARI_VERSION,
            "environment": settings.NARI_ENV,
        }
    )
