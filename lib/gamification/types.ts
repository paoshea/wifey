import { z } from 'zod';
import { type Achievement, type UserProgress, type UserStats, type PrismaClient, type Prisma } from '@prisma/client';

// Core Enums
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

export enum AchievementTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

// Core Types
export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'allTime';

// Schemas
export const RequirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.string(),
  value: z.number(),
  operator: z.nativeEnum(RequirementOperator),
  description: z.string()
});

export const StatsContentSchema = z.record(z.nativeEnum(StatsMetric), z.number());

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

export const UserStatsSchema = z.object({
  id: z.string(),
  userProgressId: z.string(),
  stats: StatsContentSchema.transform(statsToJson),
  createdAt: z.date(),
  updatedAt: z.date()
});

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

export const MeasurementInputSchema = z.object({
  type: z.enum(['wifi', 'coverage']),
  value: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  deviceInfo: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  ssid: z.string().optional(),
  bssid: z.string().optional(),
  frequency: z.number().optional(),
  channel: z.number().optional(),
  security: z.string().optional(),
  operator: z.string().optional(),
  networkType: z.string().optional(),
  signalStrength: z.number().optional(),
  isRural: z.boolean(),
  isFirstInArea: z.boolean(),
  distance: z.number().optional()
});

// Inferred Types
export type Requirement = z.infer<typeof RequirementSchema>;
export type StatsContent = z.infer<typeof StatsContentSchema>;
export type MeasurementInput = z.infer<typeof MeasurementInputSchema>;
export type ValidatedMeasurementInput = MeasurementInput;
export type ValidatedUserStats = z.infer<typeof UserStatsSchema>;
export type ValidatedUserProgress = z.infer<typeof UserProgressSchema>;
export type ValidatedAchievement = z.infer<typeof AchievementSchema>;

// Utility Types
export type StatsUpdate = {
  [K in StatsMetric]?: number;
};

// Result Types
export interface MeasurementResult {
  points: number;
  xp: number;
  bonuses: Record<string, number>;
  achievements: AchievementNotification[];
  newLevel?: number;
  newStats: StatsContent;
}

export interface AchievementNotification {
  achievement: Achievement;
  pointsEarned: number;
  newLevel?: number;
}

// Re-export Prisma types
export type { Achievement, UserProgress, UserStats };

// Type Guards
export function isValidStatsContent(data: unknown): data is StatsContent {
  return StatsContentSchema.safeParse(data).success;
}

export function isValidMeasurementInput(data: unknown): data is MeasurementInput {
  return MeasurementInputSchema.safeParse(data).success;
}

// Helper Functions
export const statsToJson = (stats: StatsContent): Prisma.JsonValue => {
  return stats as Prisma.JsonValue;
};

export const jsonToStats = (json: Prisma.JsonValue): StatsContent => {
  const result = StatsContentSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid stats format: ${result.error.message}`);
  }
  return result.data;
};
