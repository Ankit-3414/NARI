"""API key authentication and security utilities."""

from fastapi import HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

security = HTTPBearer(auto_error=False)


import secrets


def verify_api_key(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> str:
    """Verify the provided API key from header or cookie.

    Prioritizes the Authorization header (CLI usage) then checks for a cookie.
    
    Raises:
        HTTPException: If the API key is missing or invalid.
    """
    token = None
    
    # 1. Check Authorization header
    if credentials:
        token = credentials.credentials
    
    # 2. Check Cookie (for web frontend)
    if not token:
        token = request.cookies.get("nari_api_key")

    if token is None or not secrets.compare_digest(
        token, settings.NARI_API_KEY
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Missing or invalid API key",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token
