import { z } from 'zod';

// Achievement requirement types
export const MeasurementCountRequirement = z.object({
  type: z.literal('MEASUREMENT_COUNT'),
  threshold: z.number().min(1)
});

export const RuralMeasurementsRequirement = z.object({
  type: z.literal('RURAL_MEASUREMENTS'),
  threshold: z.number().min(1)
});

export const ConsecutiveDaysRequirement = z.object({
  type: z.literal('CONSECUTIVE_DAYS'),
  threshold: z.number().min(1)
});

export const AccuracyRateRequirement = z.object({
  type: z.literal('ACCURACY_RATE'),
  threshold: z.number().min(0).max(100)
});

export const VerificationsRequirement = z.object({
  type: z.literal('VERIFICATIONS'),
  threshold: z.number().min(1)
});

export const TimeBasedRequirement = z.object({
  type: z.literal('TIME_BASED'),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23)
});

// Union of all requirement types
export const AchievementRequirement = z.discriminatedUnion('type', [
  MeasurementCountRequirement,
  RuralMeasurementsRequirement,
  ConsecutiveDaysRequirement,
  AccuracyRateRequirement,
  VerificationsRequirement,
  TimeBasedRequirement
]);

// Achievement schema
export const AchievementSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number().positive(),
  icon: z.string(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  requirements: AchievementRequirement,
  isSecret: z.boolean()
});

// User progress validation
export const UserProgressSchema = z.object({
  totalPoints: z.number().min(0),
  level: z.number().min(1),
  currentExp: z.number().min(0),
  nextLevelExp: z.number().min(1)
});

// User stats validation
export const UserStatsSchema = z.object({
  totalMeasurements: z.number().min(0),
  ruralMeasurements: z.number().min(0),
  verifiedSpots: z.number().min(0),
  helpfulActions: z.number().min(0),
  consecutiveDays: z.number().min(0),
  qualityScore: z.number().min(0).max(100),
  accuracyRate: z.number().min(0).max(100)
});

// Streak validation
export const UserStreakSchema = z.object({
  currentStreak: z.number().min(0),
  longestStreak: z.number().min(0),
  lastActiveDate: z.date().nullable(),
  streakHistory: z.array(z.object({
    date: z.date(),
    count: z.number().min(1)
  }))
});

// Badge validation
export const UserBadgeSchema = z.object({
  badgeType: z.enum(['CONTRIBUTOR', 'EXPLORER', 'VERIFIER', 'ANALYST']),
  level: z.number().min(1),
  progress: z.number().min(0),
  nextLevel: z.number().min(1)
});

// Validation functions
export function validateAchievement(data: unknown) {
  return AchievementSchema.parse(data);
}

export function validateUserProgress(data: unknown) {
  return UserProgressSchema.parse(data);
}

export function validateUserStats(data: unknown) {
  return UserStatsSchema.parse(data);
}

export function validateUserStreak(data: unknown) {
  return UserStreakSchema.parse(data);
}

export function validateUserBadge(data: unknown) {
  return UserBadgeSchema.parse(data);
}

// Data integrity checks
export function checkDataIntegrity(data: {
  userProgress: unknown,
  userStats: unknown,
  userStreak: unknown,
  userBadges: unknown[]
}) {
  const progress = validateUserProgress(data.userProgress);
  const stats = validateUserStats(data.userStats);
  const streak = validateUserStreak(data.userStreak);
  const badges = data.userBadges.map(badge => validateUserBadge(badge));

  // Additional integrity checks
  if (progress.currentExp >= progress.nextLevelExp) {
    throw new Error('Current experience cannot be greater than next level threshold');
  }

  if (streak.currentStreak > streak.longestStreak) {
    throw new Error('Current streak cannot be greater than longest streak');
  }

  if (stats.accuracyRate > 100 || stats.qualityScore > 100) {
    throw new Error('Accuracy rate and quality score must be between 0 and 100');
  }

  return {
    progress,
    stats,
    streak,
    badges
  };
}
