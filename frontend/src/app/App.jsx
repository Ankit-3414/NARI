import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import TaskDashboard from '../components/tasks/TaskDashboard';
import StudyDashboard from '../components/study/StudyDashboard';
import NotesDashboard from '../components/notes/NotesDashboard';
import { useWebSocket } from '../hooks/useWebSocket';

// Placeholder component for main dashboard
const Dashboard = () => (
  <div className="p-4 text-center mt-10">
    <p className="text-secondary italic">Main dashboard widgets coming soon.</p>
    <p className="mt-4 text-sm">Use the bottom nav to explore NARI!</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskDashboard />} />
          <Route path="study" element={<StudyDashboard />} />
          <Route path="notes" element={<NotesDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
