import { PrismaClient, User, Prisma } from '@prisma/client';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { StatsContent } from '../gamification/types';

// Notification interfaces
export type NotificationStyle = Prisma.JsonObject & {
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  animation?: string;
};

export interface Notification {
  id: string;
  userId: string;
  type: 'STREAK_REMINDER' | 'ACHIEVEMENT' | 'STREAK_MILESTONE' | 'SOCIAL' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  style?: NotificationStyle;
  metadata?: Prisma.JsonValue;
  scheduledFor?: Date | null;
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
  constructor(private readonly prisma: PrismaClient) { }

  private createNotificationData(data: {
    userId: string;
    type: Notification['type'];
    title: string;
    message: string;
    priority: Notification['priority'];
    style?: NotificationStyle;
    metadata?: Record<string, any>;
    scheduledFor?: Date;
  }) {
    return {
      user: { connect: { id: data.userId } },
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      priority: data.priority,
      style: data.style as Prisma.InputJsonValue,
      metadata: data.metadata as Prisma.InputJsonValue,
      scheduledFor: data.scheduledFor,
    };
  }

  /**
   * Create a streak reminder notification with smart timing
   */
  async createStreakReminder(userId: string): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true
      }
    });

    if (!user?.stats) {
      return null;
    }

    // Parse stats JSON to get streak information
    const statsContent = JSON.parse(user.stats.stats as string) as StatsContent;
    const currentStreak = statsContent.consecutiveDays;
    const now = new Date();
    const today = startOfDay(now);

    // If user has already contributed today or has no streak, don't send reminder
    if (currentStreak === 0) {
      return null;
    }

    const data = this.createNotificationData({
      userId,
      type: 'STREAK_REMINDER',
      title: 'Don\'t Break Your Streak!',
      message: `Keep your ${currentStreak}-day streak going! Remember to check in today.`,
      priority: 'HIGH',
      style: {
        icon: '🔥',
        animation: 'pulse'
      },
      metadata: {
        currentStreak
      }
    });

    return await (this.prisma as any).notification.create({ data });
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

    const data = this.createNotificationData({
      userId,
      type: 'ACHIEVEMENT',
      title: 'New Achievement Unlocked! 🏆',
      message: `Congratulations! You've earned "${achievement.title}" and ${achievement.points} points!\n${achievement.description}`,
      priority: 'MEDIUM',
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
    });

    return await (this.prisma as any).notification.create({ data });
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

    const data = this.createNotificationData({
      userId,
      type: 'STREAK_MILESTONE',
      title: 'Streak Milestone! 🔥',
      message: `Amazing! You've maintained a ${days}-day streak! Your point multiplier is now ${multiplier}x!`,
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
    });

    return await (this.prisma as any).notification.create({ data });
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

    const data = this.createNotificationData({
      userId,
      type: 'SOCIAL',
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: messages[type],
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
    });

    return await (this.prisma as any).notification.create({ data });
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    userId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      scheduledFor: Date;
      metadata?: Record<string, any>;
      priority?: Notification['priority'];
      style?: NotificationStyle;
    }
  ): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    const data = this.createNotificationData({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority ?? 'MEDIUM',
      style: notification.style,
      metadata: notification.metadata,
      scheduledFor: notification.scheduledFor
    });

    return await (this.prisma as any).notification.create({ data });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await (this.prisma as any).notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(notificationIds: string[]): Promise<void> {
    await (this.prisma as any).notification.updateMany({
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
    return await (this.prisma as any).notification.findMany({
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
