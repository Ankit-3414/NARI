# Frontend Current State

This file replaces the old Stage 4/5 implementation TODO. Those stages are complete; use this as a compact frontend reference.

## Status

The frontend is a responsive React PWA with live API data, WebSocket cache invalidation, offline indicators, IndexedDB persistence, and queued sync for core entities.

## Core Capabilities

- API key auth gate.
- Dashboard with today's tasks, study state, habits, stats, and Context Stream input.
- Tasks, study, notes, reminders, subjects, goals, habits, and analytics screens.
- Note editor, note cards, and version history.
- Task history and task item components.
- Study trend charts.
- WebSocket status and event-driven query invalidation.
- Offline status and background sync for supported actions.

## Key Directories

- `src/api/`: HTTP clients and WebSocket client.
- `src/hooks/`: Feature hooks built around TanStack Query.
- `src/components/common/`: Shared controls such as ContextInput.
- `src/components/layout/`: App shell and navigation.
- `src/components/tasks/`: Task dashboards and task widgets.
- `src/components/notes/`: Notes dashboard, editor, cards, and version history.
- `src/components/analytics/`: Analytics visualizations.
- `src/pages/`: Route-level screens.
- `src/store/`: Zustand state.

## Development Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Frontend Rules

- Use existing hooks and API clients before adding new data paths.
- Use TanStack Query for server state and cache invalidation.
- Use Zustand only for local UI/session state.
- Keep components small enough to understand and split large feature surfaces.
- Keep mobile behavior polished while preserving good desktop density.
- Prefer Lucide icons for icon buttons.
- When adding offline-capable mutations, update the sync queue path as well as the online API path.
