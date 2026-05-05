"""API key authentication and security utilities."""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

security = HTTPBearer(auto_error=False)


def verify_api_key(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> str:
    """Verify the provided API key.

    Raises:
        HTTPException: If the API key is missing or invalid.
    """
    if credentials is None or credentials.credentials != settings.NARI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Missing or invalid API key",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials
