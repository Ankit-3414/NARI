"""Authentication and session management routes."""

from fastapi import APIRouter, Response, HTTPException, status
from pydantic import BaseModel
import secrets
from ...core.config import settings
from ...schemas.common import success_response, error_response

router = APIRouter(prefix="/auth", tags=["auth"])

class SessionCreate(BaseModel):
    api_key: str

@router.post("/session")
async def create_session(payload: SessionCreate, response: Response):
    """
    Establish a secure session via HttpOnly cookie.
    This protects the API key from XSS exfiltration.
    """
    if not secrets.compare_digest(payload.api_key, settings.NARI_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid API key"}
        )
    
    response.set_cookie(
        key="nari_api_key",
        value=payload.api_key,
        httponly=True,
        samesite="strict",
        secure=settings.NARI_ENV == "production",
        max_age=365 * 24 * 60 * 60, # 1 year
    )
    
    return success_response({"message": "Session established"})

@router.delete("/session")
async def delete_session(response: Response):
    """Clear the session cookie."""
    response.delete_cookie("nari_api_key")
    return success_response({"message": "Session cleared"})
