import { PrismaClient, User } from '@prisma/client';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

// Notification types
export enum NotificationType {
  STREAK_REMINDER = 'STREAK_REMINDER',
  ACHIEVEMENT = 'ACHIEVEMENT',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  SOCIAL = 'SOCIAL',
  SYSTEM = 'SYSTEM'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Notification interfaces
export interface NotificationStyle {
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  animation?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  style?: NotificationStyle;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  dailyDigest: boolean;
  streakReminders: boolean;
  achievementAlerts: boolean;
  socialNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a streak reminder notification with smart timing
   */
  async createStreakReminder(userId: string): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        streaks: true // Include user streaks
      }
    });

    if (!user) {
      return null;
    }

    const currentStreak = user.streaks[0]?.current ?? 0;
    const now = new Date();
    const lastCheckin = user.streaks[0]?.lastCheckin ?? new Date(0);
    const today = startOfDay(now);
    
    if (isAfter(lastCheckin, today) || currentStreak === 0) {
      return null;
    }

    return await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.STREAK_REMINDER,
        title: 'Don\'t Break Your Streak!',
        message: `Keep your ${currentStreak}-day streak going! Remember to check in today.`,
        isRead: false,
        priority: NotificationPriority.HIGH,
        style: {
          icon: '🔥',
          animation: 'pulse'
        },
        metadata: {
          currentStreak,
          lastCheckin: lastCheckin.toISOString()
        }
      }
    });
  }

  /**
   * Create an achievement notification with custom styling
   */
  async createAchievementNotification(
    userId: string,
    achievement: {
      title: string;
      points: number;
      description: string;
      icon?: string;
    }
  ): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    return await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.ACHIEVEMENT,
        title: 'New Achievement Unlocked! 🏆',
        message: `Congratulations! You've earned "${achievement.title}" and ${achievement.points} points!\n${achievement.description}`,
        isRead: false,
        priority: NotificationPriority.MEDIUM,
        style: {
          backgroundColor: '#4F46E5',
          textColor: '#FFFFFF',
          icon: achievement.icon ?? '🏆',
          animation: 'celebration'
        },
        metadata: {
          achievementTitle: achievement.title,
          points: achievement.points,
          description: achievement.description
        }
      }
    });
  }

  /**
   * Create a streak milestone notification with animations
   */
  async createStreakMilestoneNotification(
    userId: string,
    days: number
  ): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    const multiplier = Math.min(3, 1 + Math.floor(days / 7) * 0.5);

    return await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.STREAK_MILESTONE,
        title: 'Streak Milestone! 🔥',
        message: `Amazing! You've maintained a ${days}-day streak! Your point multiplier is now ${multiplier}x!`,
        isRead: false,
        priority: NotificationPriority.HIGH,
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
  ): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
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

    return await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SOCIAL,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: messages[type],
        isRead: false,
        priority: NotificationPriority.LOW,
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
      priority?: NotificationPriority;
      style?: NotificationStyle;
    }
  ): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    return await this.prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: false,
        priority: notification.priority ?? NotificationPriority.MEDIUM,
        style: notification.style,
        metadata: notification.metadata,
        scheduledFor: notification.scheduledFor
      }
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(notificationIds: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true }
    });
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // For now, return default preferences
    // This will be updated once we add notification preferences to the schema
    return {
      userId,
      email: true,
      push: true,
      inApp: true,
      dailyDigest: true,
      streakReminders: true,
      achievementAlerts: true,
      socialNotifications: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  }

  /**
   * Get all unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

// Export a singleton instance
const prisma = new PrismaClient();
export const notificationService = new NotificationService(prisma);
