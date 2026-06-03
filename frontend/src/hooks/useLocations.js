import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useLocations = (includeArchived = false) => {
  return useQuery({
    queryKey: ['locations', includeArchived],
    queryFn: async () => {
      try {
        const response = await client.get('/locations', { params: { include_archived: includeArchived } });
        const locations = response.data;
        
        await db.locations.clear();
        await db.locations.bulkAdd(locations);
        
        return locations;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.locations.toArray();
        }
        throw error;
      }
    },
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.locations.add({ ...payload, created_at: new Date().toISOString() });
        await queueSync('CREATE', 'locations', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/locations', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.locations.update(id, payload);
        await queueSync('UPDATE', 'locations', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/locations/${id}`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.locations.delete(id);
        await queueSync('DELETE', 'locations', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/locations/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
};
