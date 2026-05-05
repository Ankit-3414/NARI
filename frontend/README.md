# NARI Frontend

Mobile-first web dashboard for NARI (Not A Random Intelligence).

## Tech Stack
*   **React + Vite**
*   **Tailwind CSS**
*   **TanStack Query** (React Query)
*   **Lucide React** (Icons)

## Development
1.  Install dependencies: `npm install`
2.  Start the dev server: `npm run dev`
3.  The frontend will proxy `/api` requests to `http://localhost:8000`. Ensure the backend is running.

## Features
*   **Mobile-First Design:** Optimized for phone screens with a bottom navigation bar.
*   **Tasks:** View, group, and complete tasks with instant UI feedback.
*   **Study:** Dedicated focus timer with subject selection and interruption tracking.
*   **Notes:** Markdown-based note-taking with automatic version history support.

## Architecture
*   **`src/api/client.js`:** Central Axios instance for API communication.
*   **`src/hooks/`:** Custom React hooks for data fetching and state management.
*   **`src/components/layout/`:** Core App shell and navigation.
*   **`src/components/[feature]/`:** Feature-specific UI components and logic.
