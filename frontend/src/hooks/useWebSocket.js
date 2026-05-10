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

      // Every event should refresh the activity log
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      // Handle Reminders specifically for browser alerts
      if (event === 'reminder_triggered' && data) {
        notificationService.show(`NARI: ${data.title}`, {
          body: data.message || 'Signal triggered.',
          tag: `reminder-${data.id}`,
        });
      }

      // Invalidate relevant queries based on entity type
      if (entity_type === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      } else if (entity_type === 'study_session') {
        queryClient.invalidateQueries({ queryKey: ['study'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      } else if (entity_type === 'note') {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      } else if (entity_type === 'subject') {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
      } else if (entity_type === 'habit') {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      } else if (entity_type === 'goal') {
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      } else if (entity_type === 'reminder') {
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
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
