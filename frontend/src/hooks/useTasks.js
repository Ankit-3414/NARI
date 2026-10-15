import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      try {
        const response = await client.get('/tasks', { params: filters });
        const tasks = Array.isArray(response?.data) 
          ? response.data 
          : (Array.isArray(response) ? response : []);
        
        // Sync to local DB defensively
        try {
          if (Array.isArray(tasks)) {
            await db.tasks.clear();
            if (tasks.length > 0) {
              await db.tasks.bulkPut(tasks);
            }
          }
        } catch (dbErr) {
          console.warn('[IndexedDB Sync Error]', dbErr);
        }
        
        return tasks;
      } catch (error) {
        // Fallback to local DB if offline or request fails
        try {
          const localTasks = await db.tasks.toArray();
          if (localTasks && localTasks.length > 0) {
            return localTasks;
          }
        } catch (dbReadErr) {
          console.warn('[IndexedDB Read Error]', dbReadErr);
        }
        throw error;
      }
    },
  });
};

export const useTodayTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      try {
        const response = await client.get('/tasks/today');
        const tasks = Array.isArray(response?.data) 
          ? response.data 
          : (Array.isArray(response) ? response : []);
        return tasks;
      } catch (error) {
        try {
          const localTasks = await db.tasks.toArray();
          if (localTasks && localTasks.length > 0) {
            return localTasks.filter(t => t.status !== 'done');
          }
        } catch (dbReadErr) {
          console.warn('[IndexedDB Read Error]', dbReadErr);
        }
        throw error;
      }
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        // Store in local DB and queue for sync
        const id = await db.tasks.add({ ...payload, status: 'pending', created_at: new Date().toISOString() });
        await queueSync('CREATE', 'tasks', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/tasks', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.tasks.update(id, payload);
        await queueSync('UPDATE', 'tasks', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/tasks/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.tasks.delete(id);
        await queueSync('DELETE', 'tasks', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      if (!navigator.onLine) {
        await db.tasks.update(taskId, { status: 'done', completed_at: new Date().toISOString() });
        await queueSync('COMPLETE', 'tasks', { id: taskId });
        return { id: taskId, status: 'done', _offline: true };
      }
      const response = await client.post(`/tasks/${taskId}/complete`);
      return response.data;
    },
    // Optimistic Update
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId ? { ...task, status: 'done' } : task
        );
      });

      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      queryClient.setQueriesData({ queryKey: ['tasks'] }, context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useTaskHistory = (taskId) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'history'],
    queryFn: async () => {
      const response = await client.get(`/tasks/${taskId}/history`);
      return response.data;
    },
    enabled: !!taskId && navigator.onLine,
  });
};
