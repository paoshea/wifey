'use client';

import { useEffect } from 'react';
import { useNotificationStore, Notification } from '@/lib/store/notification-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Signal, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.floor((date.getTime() - Date.now()) / 1000 / 60),
    'minute'
  );
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -100 }}
    className="mb-2"
  >
    <Card className={`
      ${notification.read ? 'opacity-75' : ''}
      ${notification.type === 'success' ? 'border-green-500' : ''}
      ${notification.type === 'warning' ? 'border-yellow-500' : ''}
      ${notification.type === 'info' ? 'border-blue-500' : ''}
      ${notification.type === 'error' ? 'border-red-500' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-2">
            <Signal className={`
              w-5 h-5
              ${notification.type === 'success' ? 'text-green-500' : ''}
              ${notification.type === 'warning' ? 'text-yellow-500' : ''}
              ${notification.type === 'info' ? 'text-blue-500' : ''}
              ${notification.type === 'error' ? 'text-red-500' : ''}
            `} />
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
              {notification.coverageData && (
                <div className="mt-1 text-xs text-gray-500">
                  Provider: {notification.coverageData.provider} |
                  Signal: {notification.coverageData.signalStrength}% |
                  Recorded: {new Date(notification.coverageData.timestamp).toLocaleDateString()}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-400">
                {formatTimestamp(notification.timestamp)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(notification.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function CoverageNotifications() {
  const { notifications, markAsRead, clearNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Mark notifications as read after 5 seconds
    const timer = setTimeout(() => {
      notifications.forEach(n => {
        if (!n.read) markAsRead(n.id);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications, markAsRead]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50">
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            Coverage Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearNotifications}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear All
        </Button>
      </div>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={markAsRead}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
