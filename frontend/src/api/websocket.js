/**
 * WebSocket client for real-time updates.
 */

import { useUiStore } from '../store/uiStore';

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
    const apiKey = localStorage.getItem('NARI_API_KEY') || 
                   import.meta.env.VITE_NARI_API_KEY;
    
    // Construct WebSocket URL with token
    const wsUrl = new URL(url, window.location.origin.replace('http', 'ws'));
    if (apiKey) {
      wsUrl.searchParams.append('token', apiKey);
    }

    console.log('Connecting to WebSocket:', wsUrl.toString());
    useUiStore.getState().setWsStatus('connecting');
    this.socket = new WebSocket(wsUrl.toString());

    this.socket.onopen = () => {
      console.log('WebSocket connected');
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
      console.log('WebSocket disconnected', event.code, event.reason);
      useUiStore.getState().setWsStatus('disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onerror is usually followed by onclose, status will be handled there
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectTimeout}ms...`);
      setTimeout(() => this.connect(this.url), this.reconnectTimeout);
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
