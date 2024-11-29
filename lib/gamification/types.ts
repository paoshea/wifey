import { z } from 'zod';
import { type Achievement, type UserProgress, type UserStats, type PrismaClient, type Prisma } from '@prisma/client';

// Core Enums
export enum StatsMetric {
  TOTAL_MEASUREMENTS = 'totalMeasurements',
  RURAL_MEASUREMENTS = 'ruralMeasurements',
  UNIQUE_LOCATIONS = 'uniqueLocations',
  TOTAL_DISTANCE = 'totalDistance',
  CONTRIBUTION_SCORE = 'contributionScore',
  QUALITY_SCORE = 'qualityScore',
  ACCURACY_RATE = 'accuracyRate',
  VERIFIED_SPOTS = 'verifiedSpots',
  HELPFUL_ACTIONS = 'helpfulActions'
}

export enum RequirementType {
  STAT = 'stat',
  ACHIEVEMENT = 'achievement',
  COLLECTION = 'collection'
}

export enum RequirementOperator {
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  EQ = 'eq'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum TimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'allTime'
}

// Core Types
export interface MeasurementStats {
  isUnique: boolean;
  distance: number;
  contributionScore: number;
  qualityScore: number;
  accuracy?: number;
}

export interface ValidatedMeasurementInput {
  type: 'wifi' | 'coverage';
  value: number;
  latitude: number;
  longitude: number;
  isRural: boolean;
  isFirstInArea: boolean;
  quality?: number;
  operator?: string;
  accuracy?: number;
  stats: MeasurementStats;
  streak: number;
}

export interface MeasurementBonus {
  name: string;
  value: number;
  description: string;
}

export interface MeasurementPoints {
  value: number;
  xp: number;
  bonuses: Record<string, number>;
}

export interface MeasurementResult {
  points: MeasurementPoints;
}

export interface UserStats {
  stats: {
    points: number;
    totalMeasurements: number;
    ruralMeasurements: number;
    uniqueLocations: number;
    totalDistance: number;
    contributionScore: number;
    qualityScore: number;
    accuracyRate: number;
    verifiedSpots: number;
    helpfulActions: number;
    consecutiveDays: number;
  };
}

export interface AchievementRequirement {
  metric: StatsMetric;
  operator: RequirementOperator;
  value: number;
  type: RequirementType;
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  progress?: number;
  isCompleted?: boolean;
}

export interface ValidatedAchievement extends Achievement {
  progress: number;
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  rank: number;
  stats: {
    totalMeasurements: number;
    contributionScore: number;
    qualityScore: number;
  };
}

export interface LeaderboardResponse {
  timeframe: TimeFrame;
  entries: LeaderboardEntry[];
  totalUsers: number;
  userRank?: number;
}

// Schemas
export const MeasurementStatsSchema = z.object({
  isUnique: z.boolean(),
  distance: z.number(),
  contributionScore: z.number(),
  qualityScore: z.number(),
  accuracy: z.number().optional()
});

export const ValidatedMeasurementInputSchema = z.object({
  type: z.enum(['wifi', 'coverage']),
  value: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  isRural: z.boolean(),
  isFirstInArea: z.boolean(),
  quality: z.number().optional(),
  operator: z.string().optional(),
  accuracy: z.number().optional(),
  stats: MeasurementStatsSchema,
  streak: z.number()
});

export const MeasurementPointsSchema = z.object({
  value: z.number(),
  xp: z.number(),
  bonuses: z.record(z.string(), z.number())
});

export const MeasurementResultSchema = z.object({
  points: MeasurementPointsSchema
});

export const UserStatsSchema = z.object({
  stats: z.object({
    points: z.number(),
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
  })
});

export const AchievementRequirementSchema = z.object({
  metric: z.nativeEnum(StatsMetric),
  operator: z.nativeEnum(RequirementOperator),
  value: z.number(),
  type: z.nativeEnum(RequirementType),
  description: z.string()
});

export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tier: z.nativeEnum(AchievementTier),
  requirements: z.array(AchievementRequirementSchema),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  progress: z.number().optional(),
  isCompleted: z.boolean().optional()
});

export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  username: z.string(),
  points: z.number(),
  rank: z.number(),
  stats: z.object({
    totalMeasurements: z.number(),
    contributionScore: z.number(),
    qualityScore: z.number()
  })
});

export const LeaderboardResponseSchema = z.object({
  timeframe: z.nativeEnum(TimeFrame),
  entries: z.array(LeaderboardEntrySchema),
  totalUsers: z.number(),
  userRank: z.number().optional()
});

// Inferred Types
export type Requirement = z.infer<typeof AchievementRequirementSchema>;
export type StatsContent = z.infer<typeof UserStatsSchema>['stats'];
export type MeasurementInput = z.infer<typeof ValidatedMeasurementInputSchema>;
export type ValidatedMeasurementInput = z.infer<typeof ValidatedMeasurementInputSchema>;
export type ValidatedUserStats = z.infer<typeof UserStatsSchema>;
export type ValidatedAchievement = {
  id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  threshold: number;
  icon?: string | null;
  unlockedAt?: Date | null;
  requirements: {
    metric: keyof StatsContent;
    operator: RequirementOperator;
    value: number;
    currentValue: number;
    isComplete: boolean;
  }[];
  progress: number;
  target: number;
  tier: 'BRONZE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
};

// Utility Types
export type StatsUpdate = {
  [K in StatsMetric]?: number;
};

// Result Types
export interface AchievementNotification {
  achievementId: string;
  title: string;
  description: string;
  points: number;
  tier: 'BRONZE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

// Re-export Prisma types
export type { Achievement, UserProgress, UserStats };

// Type Guards
export function isValidStatsContent(data: unknown): data is StatsContent {
  return UserStatsSchema.safeParse(data).success;
}

export function isValidMeasurementInput(data: unknown): data is MeasurementInput {
  return ValidatedMeasurementInputSchema.safeParse(data).success;
}

// Helper Functions
export const statsToJson = (stats: StatsContent): Prisma.JsonValue => {
  return stats as Prisma.JsonValue;
};

export const jsonToStats = (json: Prisma.JsonValue): StatsContent => {
  const result = UserStatsSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid stats format: ${result.error.message}`);
  }
  return result.data.stats;
};
