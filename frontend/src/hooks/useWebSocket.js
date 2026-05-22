import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from '../api/websocket';
import { useAuthStore } from '../store/authStore';
import { notificationService } from '../utils/notificationService';

/**
 * Hook to manage WebSocket connection and react to events.
 */
export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const apiKey = useAuthStore((state) => state.apiKey);

  useEffect(() => {
    if (!apiKey) return;

    // Connect to WebSocket on mount
    wsClient.connect('/ws');

    // Subscribe to events
    const unsubscribe = wsClient.subscribe((payload) => {
      const { event, entity_type, data } = payload;

      // Handle Reminders specifically for browser alerts
      if (event === 'reminder_triggered' && data) {
        notificationService.show(`NARI: ${data.title}`, {
          body: data.message || 'Signal triggered.',
          tag: `reminder-${data.id}`,
        });
        // Specifically invalidate reminders on trigger
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      }

      // Every event should refresh the activity log
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      // Invalidate relevant queries based on entity type ONLY IF the event matches
      // This prevents "refresh loops"
      const mapping = {
        'task': ['tasks', 'analytics'],
        'study_session': ['study', 'analytics'],
        'note': ['notes'],
        'subject': ['subjects'],
        'habit': ['habits', 'analytics'],
        'goal': ['goals', 'analytics'],
        'reminder': ['reminders']
      };

      if (mapping[entity_type]) {
        mapping[entity_type].forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
    });

    return () => {
      unsubscribe();
      // We might want to keep the socket open across page navigations,
      // so we don't necessarily disconnect here unless the whole app unmounts.
    };
  }, [queryClient, apiKey]);

  return wsClient;
};
