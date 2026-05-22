import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import client from '../api/client';
import { useUiStore } from '../store/uiStore';

/**
 * Hook to synchronize the client's clock with the server's atomic clock.
 * Fetches the server time and calculates the offset.
 */
export const useTimeSync = () => {
  const setTimeOffset = useUiStore((state) => state.setTimeOffset);

  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => client.get('/health'),
    // Only run once on mount
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (data?.server_time) {
      const serverTime = new Date(data.server_time).getTime();
      const localTime = new Date().getTime();
      const offset = serverTime - localTime;
      
      console.log(`[TemporalCalibration] Server Offset: ${offset}ms`);
      setTimeOffset(offset);
    }
  }, [data, setTimeOffset]);

  return { isLoading };
};
