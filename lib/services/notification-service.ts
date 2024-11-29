import { PrismaClient, Notification, NotificationType, User } from '@prisma/client';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  inApp: boolean;
  dailyDigest: boolean;
  streakReminders: boolean;
  achievementAlerts: boolean;
  socialNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
};

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a streak reminder notification with smart timing
   */
  async createStreakReminder(userId: string): Promise<Notification> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true }
    });

    if (!user?.notificationPreferences?.streakReminders) {
      return null;
    }

    const now = new Date();
    const preferences = user.notificationPreferences;

    // Check quiet hours
    if (preferences.quietHoursStart && preferences.quietHoursEnd) {
      const currentHour = now.getHours();
      const startHour = parseInt(preferences.quietHoursStart);
      const endHour = parseInt(preferences.quietHoursEnd);

      if (currentHour >= startHour || currentHour < endHour) {
        // Schedule for after quiet hours
        return this.scheduleNotification(userId, {
          type: NotificationType.STREAK_REMINDER,
          title: 'Don\'t Break Your Streak!',
          message: 'Remember to check in today to keep your streak going!',
          scheduledFor: new Date(now.setHours(endHour, 0, 0, 0))
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.STREAK_REMINDER,
        title: 'Don\'t Break Your Streak!',
        message: 'Remember to check in today to keep your streak going!',
        isRead: false,
        priority: 'HIGH'
      }
    });
  }

  /**
   * Create an achievement notification with custom styling
   */
  async createAchievementNotification(
    userId: string,
    achievementTitle: string,
    points: number,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true }
    });

    if (!user?.notificationPreferences?.achievementAlerts) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.ACHIEVEMENT,
        title: 'New Achievement Unlocked! 🏆',
        message: `Congratulations! You've earned "${achievementTitle}" and ${points} points!`,
        isRead: false,
        priority: 'MEDIUM',
        style: {
          backgroundColor: '#4F46E5',
          textColor: '#FFFFFF',
          icon: '🏆',
          animation: 'celebration'
        },
        metadata: {
          achievementTitle,
          points,
          ...metadata
        }
      }
    });
  }

  /**
   * Create a streak milestone notification with animations
   */
  async createStreakMilestoneNotification(
    userId: string,
    days: number,
    multiplier: number
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.STREAK_MILESTONE,
        title: 'Streak Milestone! 🔥',
        message: `Amazing! You've maintained a ${days}-day streak! Your point multiplier is now ${multiplier}x!`,
        isRead: false,
        priority: 'HIGH',
        style: {
          backgroundColor: '#DC2626',
          textColor: '#FFFFFF',
          icon: '🔥',
          animation: 'flame'
        },
        metadata: {
          days,
          multiplier
        }
      }
    });
  }

  /**
   * Create a social interaction notification
   */
  async createSocialNotification(
    userId: string,
    type: 'like' | 'comment' | 'follow',
    actorName: string,
    contentType: string
  ): Promise<Notification> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true }
    });

    if (!user?.notificationPreferences?.socialNotifications) {
      return null;
    }

    const messages = {
      like: `${actorName} liked your ${contentType}`,
      comment: `${actorName} commented on your ${contentType}`,
      follow: `${actorName} started following you`
    };

    const icons = {
      like: '❤️',
      comment: '💬',
      follow: '👋'
    };

    return this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SOCIAL,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: messages[type],
        isRead: false,
        priority: 'LOW',
        style: {
          icon: icons[type],
          animation: 'slide'
        },
        metadata: {
          type,
          actorName,
          contentType
        }
      }
    });
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    userId: string,
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      scheduledFor: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: false,
        scheduledFor: notification.scheduledFor,
        metadata: notification.metadata
      }
    });
  }

  /**
   * Get unread notifications with smart grouping
   */
  async getUnreadNotifications(userId: string): Promise<{
    notifications: Notification[];
    groups: Record<string, Notification[]>;
  }> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group notifications by type
    const groups = notifications.reduce((acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    }, {} as Record<string, Notification[]>);

    return { notifications, groups };
  }

  /**
   * Mark notifications as read with batch processing
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notificationIds.length; i += batchSize) {
      const batch = notificationIds.slice(i, i + batchSize);
      await this.prisma.notification.updateMany({
        where: {
          id: {
            in: batch
          }
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }
  }

  /**
   * Create or update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await this.prisma.notificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...preferences
      },
      update: preferences
    });
  }

  /**
   * Send daily digest of notifications
   */
  async sendDailyDigest(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true }
    });

    if (!user?.notificationPreferences?.dailyDigest) {
      return;
    }

    const yesterday = startOfDay(addDays(new Date(), -1));
    const today = startOfDay(new Date());

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    });

    if (notifications.length === 0) {
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.DIGEST,
        title: 'Your Daily Summary',
        message: `You have ${notifications.length} notifications from yesterday`,
        isRead: false,
        priority: 'LOW',
        metadata: {
          notifications: notifications.map(n => ({
            type: n.type,
            title: n.title,
            message: n.message
          }))
        }
      }
    });
  }
}

// Export a singleton instance
const prisma = new PrismaClient();
export const notificationService = new NotificationService(prisma);
