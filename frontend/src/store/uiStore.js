import { create } from 'zustand';

export const useUiStore = create((set) => ({
  wsStatus: 'disconnected', // 'connected', 'connecting', 'disconnected'
  setWsStatus: (status) => set({ wsStatus: status }),
}));
