import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach API key from memory or environment
client.interceptors.request.use((config) => {
  let apiKey = useAuthStore.getState().apiKey;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    apiKey = import.meta.env.VITE_NARI_API_KEY;
  }
                 
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});


// Standard response unwrapper to match NARI contract
client.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (typeof res === 'string' && (res.includes('<!DOCTYPE html>') || res.includes('<html'))) {
      return Promise.reject({ code: 'PROXY_INTERSTITIAL', message: 'Received HTML from proxy/tunnel instead of API response.' });
    }
    if (res && res.ok === false) {
      return Promise.reject(res.error || { code: 'API_ERROR', message: 'API response was not ok' });
    }
    return res; // Returns {ok, data, error}
  },
  (error) => {
    console.error('[API_FAILURE]', error.message);
    if (error.response?.data) {
      return Promise.reject(error.response.data.error || error.response.data);
    }
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
);

export default client;
