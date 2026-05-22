import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { db } from '../db/db';

export const useActivity = (filters = {}) => {
  return useQuery({
    queryKey: ['activity', filters],
    queryFn: async () => {
      try {
        const response = await client.get('/activity', { params: filters });
        const logs = response.data;
        
        // Cache recent logs locally (limit to 50 for performance)
        if (!filters.entity_type) {
           await db.activity_logs.clear();
           await db.activity_logs.bulkAdd(logs.slice(0, 50));
        }
        
        return logs;
      } catch (error) {
        if (!navigator.onLine) {
          const localLogs = await db.activity_logs.toArray();
          return localLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        throw error;
      }
    },
    refetchInterval: 10000,
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
