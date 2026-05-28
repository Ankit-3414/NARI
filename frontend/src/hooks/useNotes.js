import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useNotes = (filters = {}) => {
  return useQuery({
    queryKey: ['notes', filters],
    queryFn: async () => {
      try {
        const response = await client.get('/notes', { params: filters });
        const notes = response.data;
        
        await db.notes.clear();
        await db.notes.bulkAdd(notes);
        
        return notes;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.notes.toArray();
        }
        throw error;
      }
    },
  });
};

export const useNote = (noteId) => {
  return useQuery({
    queryKey: ['notes', noteId],
    queryFn: async () => {
      try {
        const response = await client.get(`/notes/${noteId}`);
        return response.data;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.notes.get(parseInt(noteId));
        }
        throw error;
      }
    },
    enabled: !!noteId,
  });
};

export const useNoteVersions = (noteId) => {
  return useQuery({
    queryKey: ['notes', noteId, 'versions'],
    queryFn: async () => {
      const response = await client.get(`/notes/${noteId}/versions`);
      return response.data;
    },
    enabled: !!noteId && navigator.onLine,
  });
};

export const useNoteActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.notes.add({ ...payload, created_at: new Date().toISOString() });
        await queueSync('CREATE', 'notes', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/notes', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.notes.update(id, payload);
        await queueSync('UPDATE', 'notes', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/notes/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.setQueryData(['notes', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['notes', data.id, 'versions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.notes.delete(id);
        await queueSync('DELETE', 'notes', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/notes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ id, versionId }) => {
      const response = await client.post(`/notes/${id}/restore/${versionId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.setQueryData(['notes', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['notes', data.id, 'versions'] });
    },
  });

  const restoreArchivedMutation = useMutation({
    mutationFn: async (id) => {
      const response = await client.patch(`/notes/${id}`, { archived_at: null });
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
    restore: restoreMutation.mutate,
    restoreArchived: restoreArchivedMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isRestoringArchived: restoreArchivedMutation.isPending,
  };
};
