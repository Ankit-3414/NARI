import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileLayout from '../components/layout/MobileLayout';
import LoginPage from '../pages/LoginPage';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTimeSync } from '../hooks/useTimeSync';
import { useSyncEngine } from '../hooks/useSyncEngine';
import { useAuthStore } from '../store/authStore';
import NeuralEntrance from '../components/ui/NeuralEntrance';
import TriggeredAlertOverlay from '../components/ui/TriggeredAlertOverlay';
import PreFlightIntercept from '../components/ui/PreFlightIntercept';
import ReloadPrompt from '../components/ui/ReloadPrompt';
import { useReminderActions, useReminders } from '../hooks/useReminders';
import { alarmService } from '../utils/alarmService';

const TodayPage = lazy(() => import('../pages/TodayPage'));
const TasksPage = lazy(() => import('../pages/TasksPage'));
const StudyPage = lazy(() => import('../pages/StudyPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));
const SubjectsPage = lazy(() => import('../pages/SubjectsPage'));
const RemindersPage = lazy(() => import('../pages/RemindersPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const ActivityPage = lazy(() => import('../pages/ActivityPage'));
const GoalsPage = lazy(() => import('../pages/GoalsPage'));
const HabitsPage = lazy(() => import('../pages/HabitsPage'));

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
  const { data: reminders } = useReminders({ include_triggered: true });
  const reminderActions = useReminderActions();

  // Perform temporal calibration
  useTimeSync();

  // Initialize WebSocket connection only if we have an API key
  useWebSocket();

  // Activate Background Sync Engine
  useSyncEngine();

  const triggeredAlerts = reminders?.filter(r => r.status === 'triggered') || [];

  useEffect(() => {
    if (triggeredAlerts.length > 0) {
      alarmService.playAlarm();
    } else {
      alarmService.stopAlarm();
    }
  }, [triggeredAlerts]);

  const handleDismissAlert = (id) => {
    reminderActions.dismiss(id);
  };

  if (!apiKey) {
    return <LoginPage />;
  }

  return (
    <>
      <TriggeredAlertOverlay 
        alerts={triggeredAlerts} 
        onDismiss={handleDismissAlert} 
      />
      <PreFlightIntercept />
      <BrowserRouter>
        <Suspense fallback={null}>
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
        </Suspense>
      </BrowserRouter>
    </>
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
      <ReloadPrompt />
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
