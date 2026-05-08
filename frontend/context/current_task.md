# Current Technical State (v1.0.0-alpha.5)
    - **Backend Architecture:** FastAPI, SQLModel, SQLite (WAL mode), with a fully functional event-driven architecture
      (EventBus) for decoupled service communication and ActivityLogging.
    - **Core Services:** Tasks, Subjects, Study Sessions, Notes, Goals, Habits, and Reminders are complete and stable.
    - **Frontend:** Stage 4 complete. React SPA (Vite + Tailwind) is functional.
    - **Stage 5 (WebSockets):** COMPLETED. Real-time updates for all major entities are working.

 # Last 3 Changes Made
     1. Updated `useWebSocket` hook to handle all entity types (Habits, Goals, Reminders) and invalidate analytics.
     2. Verified WebSocket broadcast-listen loop with a live backend test.
     3. Updated documentation (`CLAUDE.md`, `SYSTEM_CHECKLIST.md`) to reflect Stage 5 completion.

 # Pending Tasks
   1. Implement Stage 6: Reminders (Browser Notifications & Scheduler).
   2. Configure APScheduler to trigger WebSocket events for upcoming reminders.
   3. Implement browser notification permission request and display logic.
   4. Wire reminder snooze/dismiss actions in the frontend.
