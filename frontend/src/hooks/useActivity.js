import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export const useActivity = (filters = {}) => {
  return useQuery({
    queryKey: ['activity', filters],
    queryFn: async () => {
      const response = await client.get('/activity', { params: filters });
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10s for "live" feel
  });
};

export const useActivityStats = () => {
  return useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const response = await client.get('/activity/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });
};
