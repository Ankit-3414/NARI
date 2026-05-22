import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logContext } from '../api/context';
import { db, queueSync } from '../db/db';

export const useLogContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text) => {
      if (!navigator.onLine) {
        // Save to local activity logs for timeline and queue for sync
        const logEntry = {
          entity_type: 'context',
          action: 'logged',
          text: text,
          timestamp: new Date().toISOString()
        };
        await db.activity_logs.add(logEntry);
        await queueSync('LOG', 'context', { text });
        return { ...logEntry, _offline: true };
      }
      return await logContext(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
};
