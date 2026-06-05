import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // We use a flag to track if the user has unlocked the session
  isAuthenticated: localStorage.getItem('NARI_SESSION_ACTIVE') === 'true',
          
  // API Key for fallback authorization (handled primarily by cookies, stored in-memory for security)
  apiKey: import.meta.env.VITE_NARI_API_KEY || null,

  setAuthenticated: (active, key = null) => {
    if (active) {
      localStorage.setItem('NARI_SESSION_ACTIVE', 'true');
    } else {
      localStorage.removeItem('NARI_SESSION_ACTIVE');
    }
    set({ isAuthenticated: active, apiKey: key || import.meta.env.VITE_NARI_API_KEY || null });
  },

  clearSession: () => {
    localStorage.removeItem('NARI_SESSION_ACTIVE');
    set({ isAuthenticated: false, apiKey: null });
  }
}));

