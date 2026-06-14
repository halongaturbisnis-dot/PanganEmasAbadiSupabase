import { appAssets } from '../../ui/styles/assets';

/**
 * Service to handle Web Push Notifications
 * Supports iOS 16.4+ and most modern browsers
 */
export const pushNotificationService = {
  /**
   * Check if push notifications are supported
   */
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Request permission from user
   */
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    return await Notification.requestPermission();
  },

  /**
   * Subscribe user to push notifications
   */
  subscribeUser: async () => {
    if (!pushNotificationService.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) return existingSubscription;

      const publicVapidKey = appAssets.pushConfig.publicVapidKey;
      if (!publicVapidKey) {
        console.error('VAPID Key is missing in assets.ts');
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: pushNotificationService.urlBase64ToUint8Array(publicVapidKey)
      });

      console.log('User Subscribed:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  },

  /**
   * Helper to convert VAPID key
   */
  urlBase64ToUint8Array: (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};
