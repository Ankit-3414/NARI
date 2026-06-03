import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // We use a flag to track if the user has unlocked the session
  isAuthenticated: localStorage.getItem('NARI_SESSION_ACTIVE') === 'true',
          
  setAuthenticated: (active) => {
    if (active) {
      localStorage.setItem('NARI_SESSION_ACTIVE', 'true');
    } else {
      localStorage.removeItem('NARI_SESSION_ACTIVE');
    }
    set({ isAuthenticated: active });
  },

  // Deprecated: apiKey is now handled via secure HttpOnly cookies
  apiKey: localStorage.getItem('NARI_SESSION_ACTIVE') === 'true' ? 'session_active' : null,

  clearSession: () => {
    localStorage.removeItem('NARI_SESSION_ACTIVE');
    set({ isAuthenticated: false, apiKey: null });
  }
}));
