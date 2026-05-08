import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await client.get('/habits');
      return response.data;
    },
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/habits', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useCompleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, note }) => {
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
