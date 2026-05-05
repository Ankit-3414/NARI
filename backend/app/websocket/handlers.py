"""WebSocket route handlers."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from .manager import manager
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """Handle WebSocket connections and authentication."""
    # Auth check
    if token != settings.NARI_API_KEY:
        logger.warning("WebSocket connection rejected: Invalid token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
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
