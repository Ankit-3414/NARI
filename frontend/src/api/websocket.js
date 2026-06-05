/**
 * WebSocket client for real-time updates.
 */

import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

const debugLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectTimeout = 5000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
    this.url = '';
  }

  connect(url) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.url = url;
    
    // Construct WebSocket URL without token in the query string
    const wsUrl = new URL(url, window.location.origin.replace('http', 'ws'));

    debugLog('Connecting to WebSocket');
    useUiStore.getState().setWsStatus('connecting');

    // Secure: API Key is passed as a subprotocol to avoid query params.
    // This handles dev environments (Vite proxy) where cookies aren't automatically forwarded.
    const apiKey = useAuthStore.getState().apiKey || import.meta.env.VITE_NARI_API_KEY;
    this.socket = new WebSocket(wsUrl.toString(), apiKey ? [apiKey] : []);

    this.socket.onopen = () => {
      debugLog('WebSocket connected');
      useUiStore.getState().setWsStatus('connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notify(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.socket.onclose = (event) => {
      debugLog('WebSocket disconnected', event.code, event.reason);
      useUiStore.getState().setWsStatus('disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      debugLog(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
      setTimeout(() => this.connect(this.url), delay);
    } else {
      console.error('Max WebSocket reconnect attempts reached');
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(data) {
    this.listeners.forEach((callback) => callback(data));
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const wsClient = new WebSocketClient();
