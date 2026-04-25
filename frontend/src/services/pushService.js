// frontend/src/services/pushService.js
class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.vapidPublicKey = null;
    this.permission = 'default';
  }

  async init() {
    try {
      const res = await fetch('/api/notifications/vapid-public-key');
      const data = await res.json();
      this.vapidPublicKey = data.publicKey;
      console.log('VAPID key loaded');
    } catch (err) {
      console.error('Failed to get VAPID key:', err);
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notifications are blocked');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting permission:', err);
      return false;
    }
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');
      
      return true;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
      return false;
    }
  }

  async subscribe() {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.vapidPublicKey) {
      await this.init();
    }

    try {
      // Check for existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Convert VAPID key to Uint8Array
        const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        console.log('New push subscription created');
      } else {
        console.log('Using existing push subscription');
      }

      // Send subscription to server
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('User not logged in, skipping server subscription');
        return false;
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      console.log('Push subscription saved to server');
      return true;
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      return false;
    }
  }

  async unsubscribe() {
    if (!this.swRegistration) return true;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/notifications/unsubscribe', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      console.log('Successfully unsubscribed');
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      return false;
    }
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

  getPermissionStatus() {
    return Notification.permission;
  }
}

export default new PushNotificationService();