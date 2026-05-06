# Frontend Implementation Guide: Stage 4 & Stage 5

The backend architecture is complete. The frontend relies on React, Tailwind, React Query, and Zustand. Here is the step-by-step guide to wire everything together.

## Phase 1: Setup & Global State

### 1. Install Missing Dependencies
Navigate to `H:\NARI\frontend` and run:
```bash
npm install zustand react-markdown recharts
```

### 2. Create the Stores
Create `src/store/authStore.js`:
```javascript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  apiKey: localStorage.getItem('NARI_API_KEY') || null,
  setApiKey: (key) => {
    localStorage.setItem('NARI_API_KEY', key);
    set({ apiKey: key });
  },
  clearApiKey: () => {
    localStorage.removeItem('NARI_API_KEY');
    set({ apiKey: null });
  }
}));
```

Create `src/store/uiStore.js`:
```javascript
import { create } from 'zustand';

export const useUiStore = create((set) => ({
  wsStatus: 'disconnected', // 'connected', 'connecting', 'disconnected'
  setWsStatus: (status) => set({ wsStatus: status }),
}));
```

### 3. Build the Auth Gate
In `src/app/App.jsx`, read the `apiKey` from `useAuthStore`. If it is null, return a simple login screen (a centered card with an input field for the API key and a submit button). If the key exists, return the `BrowserRouter` layout.

### 4. Wire Connection Status in the Header
In `src/components/layout/MobileLayout.jsx`, read `wsStatus` from `useUiStore`. Add a small dot next to the "NARI" title:
- Green (`bg-green-500`) for `connected`
- Yellow (`bg-yellow-500`) for `connecting`
- Red (`bg-red-500`) for `disconnected`

---

## Phase 2: API & React Query Hooks

For each entity (Tasks, Study, Notes), you need an API module and a custom hook.

### 1. Tasks API
**File:** `src/api/tasks.js`
```javascript
import client from './client';
export const getTasks = () => client.get('/tasks');
export const createTask = (data) => client.post('/tasks', data);
export const completeTask = (id) => client.post(`/tasks/${id}/complete`);
```
**File:** `src/hooks/useTasks.js`
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/tasks';

export const useTasks = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['tasks'], queryFn: api.getTasks });
  
  const createMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => queryClient.invalidateQueries(['tasks']),
  });

  return { ...query, createTask: createMutation.mutate };
};
```

*Repeat this exact pattern for `study` (start/pause/resume/stop) and `notes` (list/create/update).*

---

## Phase 3: WebSockets (Real-time Sync)

### 1. Update `wsClient` to track status
Modify `src/api/websocket.js` to dispatch state changes to `uiStore`:
```javascript
import { useUiStore } from '../store/uiStore';

// Inside connect():
this.socket.onopen = () => {
  useUiStore.getState().setWsStatus('connected');
};
this.socket.onclose = () => {
  useUiStore.getState().setWsStatus('disconnected');
};
```

### 2. Auto-Invalidation
The `useWebSocket.js` hook is already listening. Because you wired up `React Query` with keys like `['tasks']` and `['notes']`, when the WebSocket receives a `task_updated` event, the hook will call `queryClient.invalidateQueries({ queryKey: ['tasks'] })`. This will silently refetch the data in the background, updating the UI instantly without page reloads.

---

## Phase 4: Feature Dashboards

### 1. Tasks Dashboard
Update `src/components/tasks/TaskDashboard.jsx`. Use the `useTasks` hook. Map over the tasks and display them. Add a simple input at the top to create a new task by calling `createTask()`.

### 2. Study Dashboard
Update `src/components/study/StudyDashboard.jsx`. 
- Use the `useStudy` hook to `get_active_session`.
- If active, show a local React timer (`setInterval` running locally) that counts up from the backend's `started_at` or `resumed_at` timestamp.
- Add Start/Pause/Stop buttons that call the respective API endpoints. The WebSocket will instantly invalidate and refresh the UI state when these calls succeed.

### 3. Notes Dashboard
Update `src/components/notes/NotesDashboard.jsx`.
- Render a list of notes.
- When a note is clicked, render its `content_markdown` using the `react-markdown` component.
- Add an edit view with a simple `<textarea>` that calls `updateNote()`.
