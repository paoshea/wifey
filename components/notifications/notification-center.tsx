// components/notifications/notification-center.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Settings, Filter } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { Notification, NotificationPreferences } from '@/types/notifications'
import { NotificationType } from '@/types/notifications'
import { Dialog } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const NotificationTypes = {
  STREAK_REMINDER: 'STREAK_REMINDER',
  ACHIEVEMENT: 'ACHIEVEMENT',
  STREAK_MILESTONE: 'STREAK_MILESTONE',
  SOCIAL: 'SOCIAL',
  SYSTEM: 'SYSTEM',
  DIGEST: 'DIGEST'
} as const;

interface NotificationGroup {
  type: typeof NotificationTypes[keyof typeof NotificationTypes]
  notifications: Notification[]
  icon: string
  label: string
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<Record<string, Notification[]>>({});
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
      const data = await response.json();
      setNotifications(data.notifications);
      setGroups(data.groups);
      setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
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
      type: NotificationTypes.STREAK_REMINDER,
      notifications: groups[NotificationTypes.STREAK_REMINDER] || [],
      icon: '🔥',
      label: 'Streak Reminders'
    },
    {
      type: NotificationTypes.ACHIEVEMENT,
      notifications: groups[NotificationTypes.ACHIEVEMENT] || [],
      icon: '🏆',
      label: 'Achievements'
    },
    {
      type: NotificationTypes.STREAK_MILESTONE,
      notifications: groups[NotificationTypes.STREAK_MILESTONE] || [],
      icon: '⭐',
      label: 'Milestones'
    },
    {
      type: NotificationTypes.SOCIAL,
      notifications: groups[NotificationTypes.SOCIAL] || [],
      icon: '👥',
      label: 'Social'
    },
    {
      type: NotificationTypes.DIGEST,
      notifications: groups[NotificationTypes.DIGEST] || [],
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
                    disabled={group.notifications.length === 0}
                  >
                    {group.icon}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="max-h-96 overflow-y-auto">
                <TabsContent value="all">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead([notification.id])}
                      />
                    ))
                  )}
                </TabsContent>

                {notificationGroups.map((group) => (
                  <TabsContent key={group.type} value={group.type}>
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium text-gray-500">
                        {group.label}
                      </div>
                      {group.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={() => markAsRead([notification.id])}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <button
                  onClick={() => markAsRead(notifications.map((n) => n.id))}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Channels</h4>
                  <div className="space-y-2">
                    {Object.entries({
                      inApp: 'In-app notifications',
                      email: 'Email notifications',
                      push: 'Push notifications',
                      dailyDigest: 'Daily digest'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span>{label}</span>
                        <Switch
                          checked={preferences[key as keyof NotificationPreferences] as boolean}
                          onCheckedChange={(checked) =>
                            updatePreferences({ [key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-2">
                    {Object.entries({
                      streakReminders: 'Streak reminders',
                      achievementAlerts: 'Achievement alerts',
                      socialNotifications: 'Social notifications'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span>{label}</span>
                        <Switch
                          checked={preferences[key as keyof NotificationPreferences] as boolean}
                          onCheckedChange={(checked) =>
                            updatePreferences({ [key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quiet Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Start</label>
                      <input
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) =>
                          updatePreferences({ quietHoursStart: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">End</label>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) =>
                          updatePreferences({ quietHoursEnd: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowSettings(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
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
  const style = notification.style || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`p-4 border-b hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''
        }`}
      style={{
        backgroundColor: style.backgroundColor,
        color: style.textColor
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">
          {style.icon || '📢'}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{notification.title}</h4>
          <p className="text-sm text-gray-600">
            {notification.message}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
            {new Date(notification.createdAt).toLocaleTimeString()}
          </div>
        </div>
        {!notification.isRead && (
          <button
            onClick={onMarkAsRead}
            className="text-blue-500 hover:text-blue-700"
          >
            <Check className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
