import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, PushSubscription } from '@/lib/services/push-notification';
import { useMonitoring } from '@/components/providers/monitoring-provider';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
    error: null,
  });

  const { trackEvent } = useMonitoring();

  // Initialize push notification service
  useEffect(() => {
    const initialize = async () => {
      try {
        const isSupported = pushNotificationService.isPushSupported();
        setState(prev => ({ ...prev, isSupported }));

        if (isSupported) {
          await pushNotificationService.initialize();
          const permission = pushNotificationService.getPermissionStatus();
          const isSubscribed = await pushNotificationService.getSubscriptionStatus();

          setState(prev => ({
            ...prev,
            permission,
            isSubscribed,
            isLoading: false,
          }));

          trackEvent('push_notifications_initialized', {
            supported: isSupported,
            permission,
            subscribed: isSubscribed,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize push notifications';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        trackEvent('push_notifications_error', {
          error: errorMessage,
          phase: 'initialization',
        });
      }
    };

    initialize();
  }, [trackEvent]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await pushNotificationService.subscribe();
      
      if (subscription) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false,
        }));

        trackEvent('push_notifications_subscribed');

        // Send subscription to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });

        return subscription;
      }

      throw new Error('Failed to get push subscription');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to push notifications';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      trackEvent('push_notifications_error', {
        error: errorMessage,
        phase: 'subscription',
      });

      return null;
    }
  }, [trackEvent]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          isLoading: false,
        }));

        trackEvent('push_notifications_unsubscribed');

        // Notify backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
        });

        return true;
      }

      throw new Error('Failed to unsubscribe from push notifications');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      trackEvent('push_notifications_error', {
        error: errorMessage,
        phase: 'unsubscription',
      });

      return false;
    }
  }, [trackEvent]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await pushNotificationService.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
        isLoading: false,
      }));

      trackEvent('push_notifications_permission', {
        status: permission,
      });

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request notification permission';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      trackEvent('push_notifications_error', {
        error: errorMessage,
        phase: 'permission_request',
      });

      return 'denied' as NotificationPermission;
    }
  }, [trackEvent]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await pushNotificationService.sendTestNotification();
      trackEvent('push_notifications_test_sent');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test notification';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));

      trackEvent('push_notifications_error', {
        error: errorMessage,
        phase: 'test_notification',
      });

      return false;
    }
  }, [trackEvent]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
    isIOS: pushNotificationService.isIOS(),
  };
}
