import { create } from 'zustand';

export const useUiStore = create((set) => ({
  wsStatus: 'disconnected', // 'connected', 'connecting', 'disconnected'
  timeOffset: 0, // In milliseconds: ServerTime - LocalTime
  
  setWsStatus: (status) => set({ wsStatus: status }),
  setTimeOffset: (offset) => set({ timeOffset: offset }),
}));
