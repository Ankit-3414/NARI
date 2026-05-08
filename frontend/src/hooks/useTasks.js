import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await client.get('/tasks', { params: filters });
      return response.data;
    },
  });
};

export const useTodayTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const response = await client.get('/tasks/today');
      return response.data;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
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
