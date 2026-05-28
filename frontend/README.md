# NARI Frontend

Responsive web dashboard and PWA shell for NARI.

## Tech Stack

- React and Vite.
- Tailwind CSS.
- TanStack Query for server state.
- Zustand for local UI state.
- Lucide React for icons.
- IndexedDB and service worker support for offline workflows.

## Development

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`. Start the backend before using API-backed screens.

## Production Build

```bash
npm run build
npm run preview
```

## Features

- Dashboard with today view, quick stats, active study session, tasks, habits, and Context Stream input.
- Task, study, notes, reminders, goals, habits, and analytics pages.
- WebSocket-backed cache invalidation for live updates.
- API key auth gate.
- PWA installation and offline status.
- IndexedDB-backed local persistence and queued sync for offline actions.

## Architecture

- `src/api/`: API clients and WebSocket client.
- `src/hooks/`: TanStack Query hooks and feature data access.
- `src/components/layout/`: App shell and navigation.
- `src/components/common/`: Shared UI components.
- `src/components/[feature]/`: Feature-specific UI.
- `src/pages/`: Route-level page components.
- `src/store/`: Zustand stores.
