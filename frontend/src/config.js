// API Configuration
// Change this to your backend server IP address
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.240:5000';
export const API_BASE = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
