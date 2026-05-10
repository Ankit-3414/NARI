import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach API key from local storage or environment
client.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('NARI_API_KEY') || 
                 import.meta.env.VITE_NARI_API_KEY || 
                 'neural_link_established';
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

// Standard response unwrapper to match NARI contract
client.interceptors.response.use(
  (response) => {
    return response.data; // Returns {ok, data, error}
  },
  (error) => {
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
