import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useGoals = (status = 'active') => {
  return useQuery({
    queryKey: ['goals', status],
    queryFn: async () => {
      const response = await client.get('/goals', { params: { status } });
      return response.data;
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/goals', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, increment }) => {
      const response = await client.post(`/goals/${id}/progress`, { increment });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};
