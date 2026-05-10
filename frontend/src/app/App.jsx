import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileLayout from '../components/layout/MobileLayout';
import TodayPage from '../pages/TodayPage';
import TasksPage from '../pages/TasksPage';
import StudyPage from '../pages/StudyPage';
import NotesPage from '../pages/NotesPage';
import SubjectsPage from '../pages/SubjectsPage';
import RemindersPage from '../pages/RemindersPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ActivityPage from '../pages/ActivityPage';
import GoalsPage from '../pages/GoalsPage';
import HabitsPage from '../pages/HabitsPage';
import LoginPage from '../pages/LoginPage';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';
import NeuralEntrance from '../components/ui/NeuralEntrance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const apiKey = useAuthStore((state) => state.apiKey);

  // Initialize WebSocket connection only if we have an API key
  useWebSocket();

  if (!apiKey) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="habits" element={<HabitsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const [showEntrance, setShowEntrance] = useState(false);
  const [initChecked, setInitChecked] = useState(false);

  useEffect(() => {
    // sessionStorage persists across reloads but clears when tab/window is closed
    const hasBootedInSession = sessionStorage.getItem('nari_session_booted');
    
    if (hasBootedInSession !== 'true') {
      setShowEntrance(true);
    }
    setInitChecked(true);
  }, []);

  const handleEntranceComplete = () => {
    sessionStorage.setItem('nari_session_booted', 'true');
    setShowEntrance(false);
  };

  if (!initChecked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        {showEntrance ? (
          <NeuralEntrance
            key="entrance"
            onComplete={handleEntranceComplete}
          />
        ) : (
          <AppContent key="content" />
        )}
      </AnimatePresence>
    </QueryClientProvider>
  );
}

export default App;
