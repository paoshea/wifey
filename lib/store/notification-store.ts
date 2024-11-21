import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: number;
  read: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  coverageData?: {
    provider: string;
    signalStrength: number;
    timestamp: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  lastCheckedLocation?: {
    lat: number;
    lng: number;
    timestamp: number;
  };
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  setLastCheckedLocation: (location: { lat: number; lng: number }) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notification-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 100), // Keep only last 100 notifications
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () =>
        set({
          notifications: [],
        }),

      setLastCheckedLocation: (location) =>
        set({
          lastCheckedLocation: {
            ...location,
            timestamp: Date.now(),
          },
        }),
    }),
    {
      name: 'coverage-notifications',
    }
  )
);
