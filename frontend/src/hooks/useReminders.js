import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useReminders = (params = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ['reminders', params],
    queryFn: async () => {
      try {
        const response = await client.get('/reminders', { params });
        const reminders = response.data;
        
        await db.reminders.clear();
        await db.reminders.bulkAdd(reminders);
        
        return reminders;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.reminders.toArray();
        }
        throw error;
      }
    },
    ...queryOptions,
  });
};

export const useReminderActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.reminders.add({ ...payload, status: 'scheduled', created_at: new Date().toISOString() });
        await queueSync('CREATE', 'reminders', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/reminders', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.reminders.update(id, payload);
        await queueSync('UPDATE', 'reminders', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/reminders/${id}`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, minutes }) => {
      if (!navigator.onLine) {
        const now = new Date();
        const snoozedUntil = new Date(now.getTime() + minutes * 60000).toISOString();
        await db.reminders.update(id, { status: 'snoozed', snoozed_until: snoozedUntil });
        await queueSync('SNOOZE', 'reminders', { id, minutes });
        return { id, status: 'snoozed', snoozed_until: snoozedUntil, _offline: true };
      }
      const response = await client.post(`/reminders/${id}/snooze`, null, { params: { minutes } });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.reminders.update(id, { status: 'dismissed' });
        await queueSync('DISMISS', 'reminders', { id });
        return { id, status: 'dismissed', _offline: true };
      }
      const response = await client.post(`/reminders/${id}/dismiss`);
      return response.data;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reminders'] });

      // Snapshot the previous value
      const previousReminders = queryClient.getQueryData(['reminders']);

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ['reminders'] }, (old) => {
        if (!old) return old;
        return old.map((reminder) =>
          reminder.id === id ? { ...reminder, status: 'dismissed' } : reminder
        );
      });

      return { previousReminders };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onError: (err, id, context) => {
      console.error('[Mutation] Dismiss failed:', err);
      // Rollback on error
      if (context?.previousReminders) {
        queryClient.setQueryData(['reminders'], context.previousReminders);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.reminders.delete(id);
        await queueSync('DELETE', 'reminders', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/reminders/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const lockInMutation = useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.reminders.update(id, { is_locked_in: true, locked_in_at: new Date().toISOString() });
        await queueSync('LOCK_IN', 'reminders', { id });
        return { id, is_locked_in: true, _offline: true };
      }
      const response = await client.post(`/reminders/${id}/lock-in`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const skipMutation = useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.reminders.update(id, { status: 'skipped' });
        await queueSync('SKIP', 'reminders', { id });
        return { id, status: 'skipped', _offline: true };
      }
      const response = await client.post(`/reminders/${id}/skip`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    snooze: snoozeMutation.mutate,
    dismiss: dismissMutation.mutate,
    lockIn: lockInMutation.mutate,
    skip: skipMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
