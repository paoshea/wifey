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

export interface NotificationStyle {
  backgroundColor?: string
  textColor?: string
  icon?: string
  animation?: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  priority: NotificationPriority
  style?: NotificationStyle
  metadata?: Record<string, any>
  scheduledFor?: Date
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreferences {
  userId: string
  email: boolean
  push: boolean
  inApp: boolean
  dailyDigest: boolean
  streakReminders: boolean
  achievementAlerts: boolean
  socialNotifications: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}
