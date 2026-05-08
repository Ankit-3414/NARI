"""ActivityLog routes."""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.constants import EntityType
from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...services.activity_service import activity_service

router = APIRouter(
    prefix="/activity",
    tags=["activity"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("/stats")
def get_activity_stats(session: Session = Depends(get_session)):
    stats = activity_service.get_system_stats(session)
    return success_response(stats)


@router.get("")
def list_activity(
    entity_type: EntityType | None = None,
    entity_id: int | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    entries = activity_service.list(
        session,
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
    )
    return success_response([activity_service.to_data(entry) for entry in entries])
