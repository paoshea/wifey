import { z } from 'zod';
import { Achievement, UserProgress, UserStats, PrismaClient, Prisma } from '@prisma/client';

// Enums (matching Prisma schema)
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum AchievementTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum RequirementType {
  STAT = 'STAT',
  STREAK = 'STREAK',
  LEVEL = 'LEVEL',
  ACHIEVEMENT = 'ACHIEVEMENT'
}

export enum RequirementOperator {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_EQUAL = 'GREATER_THAN_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_EQUAL = 'LESS_THAN_EQUAL',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL'
}

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'allTime';

// Requirement Schema
export const RequirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.string(),
  value: z.number(),
  operator: z.nativeEnum(RequirementOperator),
  description: z.string()
});

export type Requirement = z.infer<typeof RequirementSchema>;
export type AchievementRequirement = Requirement;

// Stats Metric Enum
export enum StatsMetric {
  TOTAL_MEASUREMENTS = 'totalMeasurements',
  RURAL_MEASUREMENTS = 'ruralMeasurements',
  VERIFIED_SPOTS = 'verifiedSpots',
  HELPFUL_ACTIONS = 'helpfulActions',
  CONSECUTIVE_DAYS = 'consecutiveDays',
  QUALITY_SCORE = 'qualityScore',
  ACCURACY_RATE = 'accuracyRate',
  UNIQUE_LOCATIONS = 'uniqueLocations',
  TOTAL_DISTANCE = 'totalDistance',
  CONTRIBUTION_SCORE = 'contributionScore'
}

// Stats Content Schema
export const StatsContentSchema = z.object({
  totalMeasurements: z.number(),
  ruralMeasurements: z.number(),
  uniqueLocations: z.number(),
  totalDistance: z.number(),
  contributionScore: z.number(),
  qualityScore: z.number(),
  accuracyRate: z.number(),
  verifiedSpots: z.number(),
  helpfulActions: z.number(),
  consecutiveDays: z.number()
});

export type StatsContent = z.infer<typeof StatsContentSchema>;

// Convert raw stats to Prisma.JsonValue
export const statsToJson = (stats: StatsContent): Prisma.JsonValue => {
  return stats as Prisma.JsonValue;
};

// Convert Prisma.JsonValue to StatsContent
export const jsonToStats = (json: Prisma.JsonValue): StatsContent => {
  const result = StatsContentSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid stats format: ${result.error.message}`);
  }
  return result.data;
};

// User Stats Schema (matching Prisma schema)
export const UserStatsSchema = z.object({
  id: z.string(),
  userProgressId: z.string(),
  stats: StatsContentSchema.transform(statsToJson),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ValidatedUserStats = z.infer<typeof UserStatsSchema>;

// Achievement Schema (matching Prisma schema)
export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  points: z.number(),
  tier: z.nativeEnum(AchievementTier),
  rarity: z.nativeEnum(AchievementTier),
  requirements: z.array(RequirementSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

export interface ValidatedRequirement extends Requirement {
  currentValue: number;
  isMet: boolean;
}

export interface ValidatedAchievement extends Omit<Achievement, 'requirements'> {
  requirements: ValidatedRequirement[];
  progress: number;
  target: number;
  rarity: AchievementTier;
  tier: AchievementTier;
}

// LeaderboardEntry Schema
export const LeaderboardEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'allTime']),
  points: z.number(),
  rank: z.number(),
  updatedAt: z.date()
});

export type ValidatedLeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// User Progress Schema (matching Prisma schema)
export const UserProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalPoints: z.number(),
  level: z.number(),
  currentXP: z.number(),
  totalXP: z.number(),
  nextLevelXP: z.number(),
  streak: z.number(),
  lastActive: z.date(),
  unlockedAchievements: z.number(),
  lastAchievementAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  stats: StatsContentSchema.transform(statsToJson),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    tier: z.nativeEnum(AchievementTier),
    points: z.number(),
    progress: z.number(),
    completed: z.boolean(),
    unlockedAt: z.date().nullable()
  }))
});

export type ValidatedUserProgress = z.infer<typeof UserProgressSchema>;

// Achievement Progress Type (matching UserAchievement model)
export const AchievementProgressSchema = z.object({
  id: z.string(),
  userProgressId: z.string(),
  achievementId: z.string(),
  progress: z.number(),
  target: z.number().optional(),
  isCompleted: z.boolean(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  achievement: z.lazy(() => AchievementSchema)
});

export type AchievementProgress = z.infer<typeof AchievementProgressSchema>;

// Achievement Notification Type
export interface AchievementNotification {
  achievement: Achievement;
  pointsEarned: number;
  newLevel?: number;
}

// Activity Data Types
export interface ActivityData {
  date: string;
  measurements: number;
  rural: number;
}

export interface FormattedActivityData {
  date: string;
  value: number;
  ruralValue: number;
}

// Filter and Sort Types
export type SortOption = 'tier' | 'progress' | 'date' | 'unlocked';

export interface AchievementFilter {
  completed?: boolean;
  tier?: AchievementTier;
  search?: string;
}

// Color Types
export type TierColors = {
  [key in AchievementTier]: string;
};

// Stats Update Type
export type StatsUpdate = Partial<StatsContent>;

// Result Types
export interface MeasurementResult {
  points: number;
  xp: number;
  bonuses: Record<string, number>;
  achievements: AchievementNotification[];
  newLevel?: number;
  newStats: StatsContent;
}

export interface AchievementCheckResult {
  completed: boolean;
  progress: number;
  notification?: AchievementNotification;
}

// Input Validation Schemas
export const MeasurementInputSchema = z.object({
  isRural: z.boolean(),
  isFirstInArea: z.boolean(),
  quality: z.number().min(0).max(100),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  device: z.object({
    type: z.string(),
    model: z.string(),
    os: z.string()
  }).optional()
});

export type ValidatedMeasurementInput = z.infer<typeof MeasurementInputSchema>;

// Type Guards
export function isValidStatsContent(data: unknown): data is StatsContent {
  try {
    StatsContentSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidUserStats(data: unknown): data is ValidatedUserStats {
  try {
    UserStatsSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidUserProgress(data: unknown): data is ValidatedUserProgress {
  try {
    UserProgressSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidAchievement(data: unknown): data is ValidatedAchievement {
  try {
    AchievementSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidAchievementProgress(data: unknown): data is AchievementProgress {
  try {
    AchievementProgressSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// Transaction Context Type
export interface TransactionContext {
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
  userId: string;
  now: Date;
}

// Leaderboard Types
export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  username: string;
  points: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  };
  contributions: number;
  badges: number;
  image?: string | null;
  timeframe?: string;
  updatedAt?: Date;
  displayName?: string;
  topAchievements?: Achievement[];
  avatarUrl?: string | null;
}

export interface LeaderboardStats {
  totalUsers: number;
  totalContributions: number;
  topContributor: string;
  mostBadges: string;
  longestStreak: number;
  highestLevel: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  stats?: LeaderboardStats;
}

// Export Prisma Types
export type { Achievement, UserProgress, UserStats };
