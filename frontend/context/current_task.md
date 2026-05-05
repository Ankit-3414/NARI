# Current Technical State (v1.0.0-alpha.4)
    - **Backend Architecture:** FastAPI, SQLModel, SQLite (WAL mode), with a fully functional event-driven architecture
      (EventBus) for decoupled service communication and ActivityLogging.
    - **Core Services:** Tasks, Subjects + Study Sessions, and Notes with auto-versioning are complete and stable.
    - **Frontend:** Stage 4 complete. React SPA (Vite + Tailwind) is functional.
    - **Stage 5 (WebSockets):** Starting implementation for real-time updates.

 # Last 3 Changes Made
     1. Adopted Semantic Versioning protocol (v1.0.0-alpha.4) and updated documentation (`CLAUDE.md`, `NARI_Architecture.md`).
     2. Renamed `NARI_v3_Architecture.md` to `NARI_Architecture.md` to align with new versioning.
     3. Verified backend environment (venv/uvicorn) is functional and starts correctly.

 # Pending Tasks
   1. Implement `backend/app/websocket/manager.py` for connection handling.
   2. Create `/ws` endpoint in FastAPI and wire it to the `ConnectionManager`.
   3. Update `core/events.py` to broadcast events to connected WebSocket clients.
   4. Configure `frontend/src/api/client.js` and hooks to handle live updates.