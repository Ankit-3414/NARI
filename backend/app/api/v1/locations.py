from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session

from ...db.session import get_session
from ...schemas.common import success_response, error_response
from ...schemas.location import LocationCreate, LocationUpdate
from ...services.location_service import location_service
from ...core.security import verify_api_key

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
    dependencies=[Depends(verify_api_key)],
)

@router.get("", response_model=dict)
async def list_locations(
    include_archived: bool = Query(False),
    session: Session = Depends(get_session)
):
    """List all saved physical locations."""
    try:
        locations = await location_service.list(session, include_archived=include_archived)
        return success_response(locations)
    except Exception as e:
        return error_response("LOCATION_LIST_FAILED", str(e))

@router.post("", response_model=dict)
async def create_location(
    payload: LocationCreate,
    session: Session = Depends(get_session)
):
    """Save a new physical location."""
    try:
        location = await location_service.create_location(session, payload)
        return success_response(location)
    except Exception as e:
        return error_response("LOCATION_CREATE_FAILED", str(e))

@router.get("/{location_id}", response_model=dict)
async def get_location(
    location_id: int,
    session: Session = Depends(get_session)
):
    """Get details of a specific location."""
    try:
        location = location_service.get(session, location_id)
        if not location:
            return error_response("LOCATION_NOT_FOUND", f"Location with id {location_id} does not exist")
        return success_response(location)
    except Exception as e:
        return error_response("LOCATION_GET_FAILED", str(e))

@router.patch("/{location_id}", response_model=dict)
async def update_location(
    location_id: int,
    payload: LocationUpdate,
    session: Session = Depends(get_session)
):
    """Update a saved location."""
    try:
        location = await location_service.update_location(session, location_id, payload)
        return success_response(location)
    except Exception as e:
        return error_response("LOCATION_UPDATE_FAILED", str(e))

@router.delete("/{location_id}", response_model=dict)
async def delete_location(
    location_id: int,
    session: Session = Depends(get_session)
):
    """Archive a saved location."""
    try:
        location = await location_service.delete_location(session, location_id)
        return success_response(location)
    except Exception as e:
        return error_response("LOCATION_DELETE_FAILED", str(e))
