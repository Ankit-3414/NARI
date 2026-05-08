import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useSubjects = (includeArchived = false) => {
  return useQuery({
    queryKey: ['subjects', includeArchived],
    queryFn: async () => {
      const response = await client.get('/subjects', { params: { include_archived: includeArchived } });
      return response.data;
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
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
      // If there is no dedicated archive endpoint, we use update
      const response = await client.patch(`/subjects/${id}`, { is_archived: true });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useActiveSession = () => {
  return useQuery({
    queryKey: ['study', 'active'],
    queryFn: async () => {
      const response = await client.get('/study/active');
      return response.data && Object.keys(response.data).length > 0 ? response.data : null;
    },
    refetchInterval: 5000, // Check for status updates every 5s
  });
};

export const useTodayStudyStats = () => {
  return useQuery({
    queryKey: ['study', 'today'],
    queryFn: async () => {
      const response = await client.get('/study/today');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useStudyActions = () => {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/study/start', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post('/study/active/pause');
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post('/study/active/resume');
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study'] }),
  });

  const stopMutation = useMutation({
    mutationFn: async (notes) => {
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
