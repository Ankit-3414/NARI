import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // We use a flag to track if the user has unlocked the session
  isAuthenticated: localStorage.getItem('NARI_SESSION_ACTIVE') === 'true',
          
  // API Key for authorization
  apiKey: localStorage.getItem('NARI_API_KEY') || import.meta.env.VITE_NARI_API_KEY || null,

  setAuthenticated: (active, key = null) => {
    if (active) {
      localStorage.setItem('NARI_SESSION_ACTIVE', 'true');
      if (key) localStorage.setItem('NARI_API_KEY', key);
    } else {
      localStorage.removeItem('NARI_SESSION_ACTIVE');
      localStorage.removeItem('NARI_API_KEY');
    }
    const resolvedKey = key || localStorage.getItem('NARI_API_KEY') || import.meta.env.VITE_NARI_API_KEY || null;
    set({ isAuthenticated: active, apiKey: resolvedKey });
  },

  clearSession: () => {
    localStorage.removeItem('NARI_SESSION_ACTIVE');
    localStorage.removeItem('NARI_API_KEY');
    set({ isAuthenticated: false, apiKey: null });
  }
}));

