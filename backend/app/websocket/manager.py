"""WebSocket connection manager with subprotocol support."""

from typing import List, Dict, Any
from fastapi import WebSocket
import json

from ..core.logging import get_logger
from ..utils.datetime_utils import utc_now

logger = get_logger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, subprotocol: str | None = None):
        """Accept a new connection."""
        await websocket.accept(subprotocol=subprotocol)
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Handle a disconnected client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, event: str, entity_type: str, entity_id: int, data: Dict[str, Any] = None):
        """Broadcast an event to all connected clients."""
        if not self.active_connections:
            return

        payload = {
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "data": data or {},
            "timestamp": utc_now().isoformat().replace("+00:00", "Z"),
        }

        message = json.dumps(payload)
        
        # Create a copy of the list to avoid issues during iteration if someone disconnects
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


manager = ConnectionManager()
