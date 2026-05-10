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
}

export const notificationService = new NotificationService();
