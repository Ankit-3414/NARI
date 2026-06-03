"""WebSocket route handlers."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from .manager import manager
from ..core.config import settings
from ..core.logging import get_logger
import secrets

logger = get_logger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """Handle WebSocket connections and authentication."""
    # Check subprotocols for authentication (Secure: passed in headers)
    subprotocols = websocket.headers.get("sec-websocket-protocol")
    subprotocol_token = None
    if subprotocols:
        # Split by comma in case multiple subprotocols were requested
        protocols = [p.strip() for p in subprotocols.split(",")]
        if protocols:
            subprotocol_token = protocols[0]

    cookie_token = websocket.cookies.get("nari_api_key")
    effective_token = subprotocol_token or cookie_token or token

    if not effective_token or not secrets.compare_digest(
        effective_token, settings.NARI_API_KEY
    ):
        logger.warning("WebSocket connection rejected: Invalid token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if subprotocol_token is None and token is not None:
        logger.warning("WebSocket connection authenticated using deprecated URL query string token. This will be removed in a future release.")

    # We agree to the subprotocol by passing the token back in the accept handshake
    await manager.connect(websocket, subprotocol=subprotocol_token)
    try:
        while True:
            # We don't expect messages from the client yet, 
            # but we need to keep the connection open and handle pings/disconnects
            data = await websocket.receive_text()
            # Echo or handle client messages if needed in future
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
