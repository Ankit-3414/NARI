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
          } else if (entity === 'reminders') {
            if (action === 'CREATE') {
              const { tempId, ...payload } = data;
              response = await client.post('/reminders', payload);
            } else if (action === 'UPDATE') {
              const { id, ...payload } = data;
              response = await client.patch(`/reminders/${id}`, payload);
            } else if (action === 'DELETE') {
              response = await client.delete(`/reminders/${data.id}`);
            } else if (action === 'SNOOZE') {
              response = await client.post(`/reminders/${data.id}/snooze`, null, { params: { minutes: data.minutes } });
            } else if (action === 'DISMISS') {
              response = await client.post(`/reminders/${data.id}/dismiss`);
            } else if (action === 'LOCK_IN') {
              response = await client.post(`/reminders/${data.id}/lock-in`);
            } else if (action === 'SKIP') {
              response = await client.post(`/reminders/${data.id}/skip`);
            }
          } else if (entity === 'study') {
            if (action === 'START') {
              response = await client.post('/study/start', data);
            } else if (action === 'PAUSE') {
              response = await client.post('/study/active/pause');
            } else if (action === 'RESUME') {
              response = await client.post('/study/active/resume');
            } else if (action === 'STOP') {
              response = await client.post('/study/active/stop', null, { params: { notes: data.notes } });
            }
          }

          // If successful, remove from queue
          await db.sync_queue.delete(event.id);
          console.log(`Neural Sync: Event ${event.id} synchronized successfully.`);
        } catch (error) {
          console.error(`Neural Sync: Failed to synchronize event ${event.id}`, error);
          
          const status = error?.response?.status || error?.status;
          if (status >= 400 && status < 500) {
            console.warn(`Neural Sync: Permanent error (${status}) for event ${event.id}. Dropping from queue.`);
            await db.sync_queue.delete(event.id);
          } else {
            // Transient error (Network, 5xx), keep in queue and stop processing for now
            break; 
          }
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
