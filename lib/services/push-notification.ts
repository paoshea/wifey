const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      await this.swRegistration.update();
    } catch (error) {
      console.error('Failed to register service worker:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        await this.initialize();
      }

      await this.requestPermission();

      const subscription = await this.swRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey),
      });

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(
            subscription.getKey('p256dh')!
          ),
          auth: this.arrayBufferToBase64(
            subscription.getKey('auth')!
          ),
        },
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        return subscription.unsubscribe();
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer) as any);
    return window.btoa(binary);
  }

  // Send a test notification
  async sendTestNotification(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    await this.swRegistration.showNotification('Wifey', {
      body: 'This is a test notification',
      icon: '/branding/logo.svg',
      badge: '/branding/logo.svg',
      silent: false,
      requireInteraction: true,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 'test',
        url: '/',
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    } as NotificationOptions);
  }

  // Check if push notifications are supported
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get current notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Check if the device is on iOS
  isIOS(): boolean {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  }

  // Get current subscription status
  async getSubscriptionStatus(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return !!subscription;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
