import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useSpatialStore } from '../store/spatialStore';

export const useAiChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ message, history }) => {
      const { currentCoords, activeNode } = useSpatialStore.getState();
      const payload = {
        message,
        history,
        latitude: currentCoords ? currentCoords[0] : null,
        longitude: currentCoords ? currentCoords[1] : null,
        active_node_label: activeNode ? activeNode.label : null
      };
      const response = await client.post('/ai/chat', payload);
      return response; // response contract is { ok, data: { text, action, status }, error }
    },

    onSuccess: (response) => {
      // Invalidate all main dashboard queries so updates pop up immediately
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['study'] });
    },
  });
};
