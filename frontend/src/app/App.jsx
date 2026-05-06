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
import { useWebSocket } from '../hooks/useWebSocket';
import EntranceAnimation from '../components/ui/EntranceAnimation';

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
          <Route index element={<TodayPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const [showEntrance, setShowEntrance] = useState(true);

  useEffect(() => {
    const hasSeenEntrance = localStorage.getItem('nari_entrance_seen');
    if (hasSeenEntrance === 'true') {
      setShowEntrance(false);
    }
  }, []);

  const handleEntranceComplete = () => {
    localStorage.setItem('nari_entrance_seen', 'true');
    setShowEntrance(false);
  };

  // Allow clearing entrance animation for testing: ?intro=true or window.clearIntro()
  useEffect(() => {
    if (window) {
      window.clearIntro = () => {
        localStorage.removeItem('nari_entrance_seen');
        setShowEntrance(true);
      };
    }
    if (new URLSearchParams(window.location.search).get('intro') === 'true') {
      localStorage.removeItem('nari_entrance_seen');
      setShowEntrance(true);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence>
        {showEntrance && (
          <EntranceAnimation
            userName="Ankit"
            onComplete={handleEntranceComplete}
          />
        )}
      </AnimatePresence>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
