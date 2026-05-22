import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      try {
        const response = await client.get('/habits');
        const habits = response.data;
        
        await db.habits.clear();
        await db.habits.bulkAdd(habits);
        
        return habits;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.habits.toArray();
        }
        throw error;
      }
    },
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.habits.add({ ...payload, current_streak: 0, created_at: new Date().toISOString() });
        await queueSync('CREATE', 'habits', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/habits', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.habits.update(id, payload);
        await queueSync('UPDATE', 'habits', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/habits/${id}`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.habits.delete(id);
        await queueSync('DELETE', 'habits', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/habits/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useCompleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, note }) => {
      if (!navigator.onLine) {
        // Optimistically update streak locally
        const habit = await db.habits.get(habitId);
        if (habit) {
          await db.habits.update(habitId, { 
            current_streak: (habit.current_streak || 0) + 1,
            last_completed_at: new Date().toISOString()
          });
        }
        await queueSync('COMPLETE', 'habits', { id: habitId, note });
        return { id: habitId, _offline: true };
      }
      const response = await client.post(`/habits/${habitId}/complete`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
};

export const useHabitLogs = (habitId) => {
  return useQuery({
    queryKey: ['habits', habitId, 'logs'],
    queryFn: async () => {
      const response = await client.get(`/habits/${habitId}/logs`);
      return response.data;
    },
    enabled: !!habitId,
  });
};
