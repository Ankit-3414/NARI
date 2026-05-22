import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      try {
        const response = await client.get('/tasks', { params: filters });
        const tasks = response.data;
        
        // Sync to local DB
        await db.tasks.clear();
        await db.tasks.bulkAdd(tasks);
        
        return tasks;
      } catch (error) {
        // If offline, fallback to local DB
        if (!navigator.onLine) {
          const localTasks = await db.tasks.toArray();
          return localTasks;
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
        return response.data;
      } catch (error) {
        if (!navigator.onLine) {
          // Approximate "today" from local tasks
          const localTasks = await db.tasks.toArray();
          return localTasks.filter(t => t.status !== 'done');
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
