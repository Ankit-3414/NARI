import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useNotes = (filters = {}) => {
  return useQuery({
    queryKey: ['notes', filters],
    queryFn: async () => {
      const response = await client.get('/notes', { params: filters });
      return response.data;
    },
  });
};

export const useNote = (noteId) => {
  return useQuery({
    queryKey: ['notes', noteId],
    queryFn: async () => {
      const response = await client.get(`/notes/${noteId}`);
      return response.data;
    },
    enabled: !!noteId,
  });
};

export const useNoteActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/notes', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await client.patch(`/notes/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.setQueryData(['notes', data.id], data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/notes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending,
  };
};
