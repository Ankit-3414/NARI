import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useReminders = (params = {}) => {
  return useQuery({
    queryKey: ['reminders', params],
    queryFn: async () => {
      const response = await client.get('/reminders', { params });
      return response.data;
    },
  });
};

export const useReminderActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/reminders', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, minutes }) => {
      const response = await client.post(`/reminders/${id}/snooze`, null, { params: { minutes } });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.post(`/reminders/${id}/dismiss`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/reminders/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  return {
    create: createMutation.mutate,
    snooze: snoozeMutation.mutate,
    dismiss: dismissMutation.mutate,
    remove: deleteMutation.mutate,
  };
};
