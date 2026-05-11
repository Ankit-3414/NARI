import { create } from 'zustand';

const SYSTEM_KEY = 'neural_link_established';

export const useAuthStore = create((set) => ({
  apiKey: localStorage.getItem('NARI_API_KEY') || 
          import.meta.env.VITE_NARI_API_KEY || 
          SYSTEM_KEY,
          
  setApiKey: (key) => {
    localStorage.setItem('NARI_API_KEY', key);
    set({ apiKey: key });
  },
  clearApiKey: () => {
    localStorage.removeItem('NARI_API_KEY');
    set({ apiKey: null });
  }
}));
