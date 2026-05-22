import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useGoals = (status = 'active') => {
  return useQuery({
    queryKey: ['goals', status],
    queryFn: async () => {
      try {
        const response = await client.get('/goals', { params: { status } });
        const goals = response.data;
        
        // Cache in local DB
        await db.goals.clear();
        await db.goals.bulkAdd(goals);
        
        return goals;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.goals.toArray();
        }
        throw error;
      }
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.goals.add({ ...payload, current_value: 0, status: 'active', created_at: new Date().toISOString() });
        await queueSync('CREATE', 'goals', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/goals', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.goals.update(id, payload);
        await queueSync('UPDATE', 'goals', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/goals/${id}`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.goals.delete(id);
        await queueSync('DELETE', 'goals', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/goals/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, increment = 1 }) => {
      if (!navigator.onLine) {
        const goal = await db.goals.get(id);
        if (goal) {
          await db.goals.update(id, { 
            current_value: (goal.current_value || 0) + increment 
          });
        }
        await queueSync('PROGRESS', 'goals', { id, increment });
        return { id, _offline: true };
      }
      const response = await client.post(`/goals/${id}/progress`, null, { 
        params: { increment } 
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};
