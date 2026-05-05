import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from '../api/websocket';

/**
 * Hook to manage WebSocket connection and react to events.
 * Primarily used for React Query cache invalidation.
 */
export const useWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to WebSocket on mount
    // In development, the URL is likely ws://localhost:8000/ws
    // In production, it might be relative or different
    wsClient.connect('/ws');

    // Subscribe to events
    const unsubscribe = wsClient.subscribe((payload) => {
      console.log('WS Event Received:', payload);
      
      const { event, entity_type } = payload;

      // Invalidate relevant queries based on entity type
      if (entity_type === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (entity_type === 'study_session') {
        queryClient.invalidateQueries({ queryKey: ['study'] });
      } else if (entity_type === 'note') {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      } else if (entity_type === 'subject') {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
      } else if (entity_type === 'activity_log') {
        queryClient.invalidateQueries({ queryKey: ['activity'] });
      }
    });

    return () => {
      unsubscribe();
      // We might want to keep the socket open across page navigations,
      // so we don't necessarily disconnect here unless the whole app unmounts.
    };
  }, [queryClient]);

  return wsClient;
};
