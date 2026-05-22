import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../db/db';
import client from '../api/client';

export const useSyncEngine = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncData = async () => {
      if (!navigator.onLine) return;

      const queue = await db.sync_queue.toArray();
      if (queue.length === 0) return;

      console.log(`Neural Sync: Processing ${queue.length} queued events...`);

      for (const event of queue) {
        try {
          let response;
          const { action, entity, data } = event;

          if (entity === 'tasks') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/tasks', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/tasks/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/tasks/${data.id}`);
            } else if (action === 'COMPLETE') {
              response = await client.post(`/tasks/${data.id}/complete`);
            }
          } else if (entity === 'notes') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/notes', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/notes/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/notes/${data.id}`);
            }
          } else if (entity === 'habits') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/habits', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/habits/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/habits/${data.id}`);
            } else if (action === 'COMPLETE') {
              response = await client.post(`/habits/${data.id}/complete`, { note: data.note });
            }
          } else if (entity === 'goals') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/goals', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/goals/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/goals/${data.id}`);
            } else if (action === 'PROGRESS') {
              response = await client.post(`/goals/${data.id}/progress`, null, { params: { increment: data.increment } });
            }
          } else if (entity === 'context') {
            if (action === 'LOG') {
              response = await client.post('/context', { text: data.text });
            }
          } else if (entity === 'subjects') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/subjects', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/subjects/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/subjects/${data.id}`);
            }
          }
          // Add other entities here (notes, goals, etc.)

          // If successful, remove from queue
          await db.sync_queue.delete(event.id);
          console.log(`Neural Sync: Event ${event.id} synchronized successfully.`);
        } catch (error) {
          console.error(`Neural Sync: Failed to synchronize event ${event.id}`, error);
          // If it's a permanent error (e.g. 400), we might want to remove it anyway
          // For now, we'll keep it in queue to retry
          break; 
        }
      }

      // Refresh all queries after sync
      queryClient.invalidateQueries();
    };

    // Run sync on mount and when coming online
    syncData();
    window.addEventListener('online', syncData);

    // Also run periodically
    const interval = setInterval(syncData, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', syncData);
      clearInterval(interval);
    };
  }, [queryClient]);
};
