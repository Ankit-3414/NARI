import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  apiKey: localStorage.getItem('NARI_API_KEY') || 
          import.meta.env.VITE_NARI_API_KEY,
          
  setApiKey: (key) => {
    localStorage.setItem('NARI_API_KEY', key);
    set({ apiKey: key });
  },
  clearApiKey: () => {
    localStorage.removeItem('NARI_API_KEY');
    set({ apiKey: null });
  }
}));
