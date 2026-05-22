# Current Technical State (v1.0.0-alpha.7)

- **Backend Architecture:** FastAPI, SQLModel, SQLite (WAL mode), EventBus-backed ActivityLog and WebSocket broadcasting.
- **Core Services:** Tasks, Subjects, Study Sessions, Notes, Goals, Habits, Reminders, and Analytics are implemented.
- **Frontend:** React SPA (Vite + Tailwind) is functional with route-level lazy loading.
- **Stage 5-8:** WebSockets, reminders/signals, goals/habits, and analytics are implemented.

## Last Changes Made

1. Fixed reminder/signal query behavior so triggered signals appear in app-wide alert surfaces.
2. Split `useReminders` API params from React Query options and restored pre-flight polling.
3. Added reminder lifecycle tests for triggered visibility, scheduler triggering, lock-in, and skip.
4. Reduced initial frontend bundle size with lazy-loaded pages.
5. Cleaned SQLModel foreign-key declarations and backend warning noise.

## Current Priority

1. Keep reminder/signal behavior stable under daily use.
2. Clean deployment/config docs without changing working runtime defaults.
3. Defer deeper recurrence/task-sync architecture changes until there is a dedicated migration plan.
