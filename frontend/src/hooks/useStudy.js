import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { db, queueSync } from '../db/db';

export const useSubjects = (includeArchived = false) => {
  return useQuery({
    queryKey: ['subjects', includeArchived],
    queryFn: async () => {
      try {
        const response = await client.get('/subjects', { params: { include_archived: includeArchived } });
        const subjects = response.data;
        
        await db.subjects.clear();
        await db.subjects.bulkAdd(subjects);
        
        return subjects;
      } catch (error) {
        if (!navigator.onLine) {
          return await db.subjects.toArray();
        }
        throw error;
      }
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.subjects.add({ ...payload, created_at: new Date().toISOString() });
        await queueSync('CREATE', 'subjects', { ...payload, tempId: id });
        return { id, ...payload, _offline: true };
      }
      const response = await client.post('/subjects', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      if (!navigator.onLine) {
        await db.subjects.update(id, payload);
        await queueSync('UPDATE', 'subjects', { id, ...payload });
        return { id, ...payload, _offline: true };
      }
      const response = await client.patch(`/subjects/${id}`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!navigator.onLine) {
        await db.subjects.delete(id);
        await queueSync('DELETE', 'subjects', { id });
        return { id, _offline: true };
      }
      const response = await client.delete(`/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useArchiveSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      // Backend delete is actually soft-delete (archive)
      const response = await client.delete(`/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useRestoreSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await client.patch(`/subjects/${id}`, { archived_at: null });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useActiveSession = () => {
  return useQuery({
    queryKey: ['study', 'active'],
    queryFn: async () => {
      try {
        const response = await client.get('/study/active');
        return response.data && Object.keys(response.data).length > 0 ? response.data : null;
      } catch (error) {
        if (!navigator.onLine) {
          const active = await db.study_sessions.orderBy('id').reverse().first();
          if (active && (active.status === 'active' || active.status === 'paused')) {
            return active;
          }
          return null;
        }
        throw error;
      }
    },
    refetchInterval: 5000, // Check for status updates every 5s
  });
};

export const useTodayStudyStats = () => {
  return useQuery({
    queryKey: ['study', 'today'],
    queryFn: async () => {
      try {
        const response = await client.get('/study/today');
        return response.data;
      } catch (error) {
        if (!navigator.onLine) {
          const completed = await db.study_sessions.where('status').equals('completed').toArray();
          const totalSeconds = completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
          return {
            total_seconds: totalSeconds,
            session_count: completed.length
          };
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useStudyActions = () => {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        const id = await db.study_sessions.add({
          subject_id: payload.subject_id,
          status: 'active',
          started_at: new Date().toISOString(),
          duration_seconds: 0
        });
        await queueSync('START', 'study', payload);
        return { id, subject_id: payload.subject_id, status: 'active', _offline: true };
      }
      const response = await client.post('/study/start', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.onLine) {
        const active = await db.study_sessions.orderBy('id').reverse().first();
        if (active && active.status === 'active') {
          await db.study_sessions.update(active.id, { status: 'paused' });
        }
        await queueSync('PAUSE', 'study', null);
        return { status: 'paused', _offline: true };
      }
      const response = await client.post('/study/active/pause');
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.onLine) {
        const active = await db.study_sessions.orderBy('id').reverse().first();
        if (active && active.status === 'paused') {
          await db.study_sessions.update(active.id, { status: 'active' });
        }
        await queueSync('RESUME', 'study', null);
        return { status: 'active', _offline: true };
      }
      const response = await client.post('/study/active/resume');
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const stopMutation = useMutation({
    mutationFn: async (notes) => {
      if (!navigator.onLine) {
        const active = await db.study_sessions.orderBy('id').reverse().first();
        if (active && (active.status === 'active' || active.status === 'paused')) {
          const duration = Math.round((new Date() - new Date(active.started_at)) / 1000);
          await db.study_sessions.update(active.id, { status: 'completed', duration_seconds: duration });
        }
        await queueSync('STOP', 'study', { notes });
        return { status: 'completed', _offline: true };
      }
      const response = await client.post('/study/active/stop', null, { params: { notes } });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  return {
    start: startMutation.mutate,
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    stop: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};
