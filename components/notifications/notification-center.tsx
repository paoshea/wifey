// components/notifications/notification-center.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Settings, Filter } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { Notification, NotificationPreferences, NotificationType } from '@/types/notifications'
import * as Dialog from '@radix-ui/react-dialog'
import { Switch } from '@/components/ui/switch'
import Button from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface NotificationGroup {
  type: NotificationType
  notifications: Notification[]
  icon: string
  label: string
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<Record<NotificationType, Notification[]>>({
    STREAK_REMINDER: [],
    ACHIEVEMENT: [],
    STREAK_MILESTONE: [],
    SOCIAL: [],
    SYSTEM: [],
    DIGEST: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: session?.user?.id || '',
    email: true,
    push: true,
    inApp: true,
    dailyDigest: true,
    streakReminders: true,
    achievementAlerts: true,
    socialNotifications: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });
      setPreferences({ ...preferences, ...newPreferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    const style = notification.style || {};
    return {
      backgroundColor: style.backgroundColor || 'transparent',
      color: style.textColor || 'inherit',
      animation: style.animation || 'none'
    };
  };

  const notificationGroups: NotificationGroup[] = [
    {
      type: 'STREAK_REMINDER',
      notifications: groups?.STREAK_REMINDER || [],
      icon: '🔥',
      label: 'Streak Reminders'
    },
    {
      type: 'ACHIEVEMENT',
      notifications: groups?.ACHIEVEMENT || [],
      icon: '🏆',
      label: 'Achievements'
    },
    {
      type: 'STREAK_MILESTONE',
      notifications: groups?.STREAK_MILESTONE || [],
      icon: '⭐',
      label: 'Milestones'
    },
    {
      type: 'SOCIAL',
      notifications: groups?.SOCIAL || [],
      icon: '👥',
      label: 'Social'
    },
    {
      type: 'DIGEST',
      notifications: groups?.DIGEST || [],
      icon: '📰',
      label: 'Digests'
    }
  ];

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full border-b p-0">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                {notificationGroups.map((group) => (
                  <TabsTrigger
                    key={group.type}
                    value={group.type}
                    className="flex-1"
                    disabled={!groups?.[group.type]?.length}
                  >
                    {group.icon}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="p-4">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No notifications
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead([notification.id])}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {notificationGroups.map((group) => (
                <TabsContent key={group.type} value={group.type} className="p-4">
                  {(!groups?.[group.type] || groups[group.type].length === 0) ? (
                    <div className="text-center text-gray-500 py-4">
                      No {group.label.toLowerCase()}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups[group.type].map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={() => markAsRead([notification.id])}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: () => void
}) {
  return (
    <div
      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative"
      style={notification.style}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{notification.title}</h4>
          <p className="text-sm text-gray-600">{notification.message}</p>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString()}
          </div>
        </div>
        {!notification.isRead && (
          <button
            onClick={onMarkAsRead}
            className="text-blue-500 hover:text-blue-600"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
