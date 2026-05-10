import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await client.get('/analytics/summary');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useAnalyticsSummary = useDashboardSummary;

export const useStudyTrends = (days = 7) => {
  return useQuery({
    queryKey: ['analytics', 'study-trends', days],
    queryFn: async () => {
      const response = await client.get('/analytics/study-trends', { params: { days } });
      return response.data;
    },
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: ['analytics', 'tasks'],
    queryFn: async () => {
      const response = await client.get('/analytics/tasks');
      return response.data;
    },
  });
};

export const useTemporalPerformance = (days = 30) => {
  return useQuery({
    queryKey: ['analytics', 'temporal', days],
    queryFn: async () => {
      const response = await client.get('/analytics/temporal-performance', { params: { days } });
      return response.data;
    },
  });
};

export const useNeuralHeatmap = (days = 365) => {
  return useQuery({
    queryKey: ['analytics', 'heatmap', days],
    queryFn: async () => {
      const response = await client.get('/analytics/neural-heatmap', { params: { days } });
      return response.data;
    },
  });
};

export const useSubjectDistribution = () => {
  return useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: async () => {
      const response = await client.get('/analytics/distribution');
      return response.data;
    },
  });
};
