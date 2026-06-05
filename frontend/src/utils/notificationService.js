import client from '../api/client';

/**
 * Browser Notification Service for NARI
 * Manages permission requests and native system notifications.
 */

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.checkPermission();
  }

  async checkPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return;
    }

    if (Notification.permission === "granted") {
      this.hasPermission = true;
    }
  }

  async requestPermission() {
    if (!("Notification" in window)) return false;

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === "granted";
    return this.hasPermission;
  }

  show(title, options = {}) {
    if (!this.hasPermission) {
      console.warn("Notification permission not granted");
      return null;
    }

    const defaultOptions = {
      icon: '/nari-logo.png', // Fallback to root logo
      badge: '/nari-logo.png',
      silent: false, // We use alarmService for sound
    };

    const notification = new Notification(title, {
      ...defaultOptions,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribeToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Web Push or Service Workers are not supported in this browser");
      return false;
    }

    try {
      // 1. Request standard permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn("Notification permission was denied.");
        return false;
      }

      // 2. Fetch VAPID public key
      const response = await client.get('/settings/vapid-public-key');
      const vapidKey = response.data?.public_key;
      if (!vapidKey) {
        throw new Error("VAPID public key not returned by backend settings");
      }

      const convertedKey = this.urlBase64ToUint8Array(vapidKey);

      // 3. Wait for service worker ready state
      const registration = await navigator.serviceWorker.ready;

      // 4. Retrieve or create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // 5. Post subscription parameters back to NARI
      await client.post('/settings/push-subscription', subscription);
      console.log("Web Push subscription registered successfully.");
      return true;
    } catch (err) {
      console.error("Web Push subscription failed:", err);
      return false;
    }
  }

  async testPushNotification() {
    try {
      const response = await client.post('/settings/push-test');
      return response.data?.success || false;
    } catch (err) {
      console.error("Failed to trigger test push:", err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
