import { z } from 'zod';
import { Prisma, type Achievement, type UserProgress } from '@prisma/client';

// Core Enums
export enum MeasurementType {
  WIFI = 'WIFI',
  COVERAGE = 'COVERAGE'
}

export enum TimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'allTime'
}

// Prisma Generated Types
export type UserStats = Prisma.UserStatsGetPayload<{
  include: {
    user: true;
  };
}>;

export type LeaderboardEntry = Prisma.LeaderboardEntryGetPayload<{
  include: {
    user: true;
  };
}>;

export type UserWithStats = Prisma.UserGetPayload<{
  include: {
    userStats: true;
    streakHistory: true;
    achievements: true;
  };
}>;

// Stats Types
export type StatsContent = {
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
  points: number;
};

// Measurement Types
export interface MeasurementStats {
  isUnique: boolean;
  distance: number;
  contributionScore: number;
  qualityScore: number;
  accuracy?: number;
}

export interface ValidatedMeasurementInput {
  type: MeasurementType;
  value: number;
  latitude: number;
  longitude: number;
  isRural: boolean;
  isFirstInArea: boolean;
  operator?: string;
  quality?: number;
  accuracy?: number;
  stats: MeasurementStats;
  streak: number;
}

export interface MeasurementResult {
  points: {
    value: number;
    xp: number;
    bonuses: Record<string, number>;
  };
  achievements: Achievement[];
  stats: StatsContent;
  xp: number;
}

// Achievement Types
export enum AchievementTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum RequirementType {
  STAT = 'STAT',
  STREAK = 'STREAK',
  MEASUREMENT = 'MEASUREMENT'
}

export enum RequirementOperator {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_EQUAL = 'GREATER_THAN_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_EQUAL = 'LESS_THAN_EQUAL',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL'
}

export interface AchievementRequirement {
  type: RequirementType;
  metric: keyof StatsContent;
  value: number;
  operator: RequirementOperator;
  description?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  points: number;
  icon?: string | null;
  type: string;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  progress: number;
  unlockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const AchievementRequirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.enum(['totalMeasurements', 'ruralMeasurements', 'uniqueLocations', 
    'totalDistance', 'contributionScore', 'qualityScore', 'accuracyRate', 
    'verifiedSpots', 'helpfulActions', 'consecutiveDays', 'points']),
  value: z.number(),
  operator: z.nativeEnum(RequirementOperator),
  description: z.string().optional()
});

export const AchievementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number().min(0),
  icon: z.string().nullable().optional(),
  type: z.string().default('achievement'),
  tier: z.nativeEnum(AchievementTier).default(AchievementTier.COMMON),
  requirements: z.array(AchievementRequirementSchema),
  progress: z.number().min(0).default(0),
  unlockedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ValidatedAchievement = z.infer<typeof AchievementSchema>;
export type ValidatedRequirement = z.infer<typeof AchievementRequirementSchema>;

// Validation Schemas
export const StatsContentSchema = z.object({
  totalMeasurements: z.number().int().min(0).describe('Total number of measurements taken'),
  ruralMeasurements: z.number().int().min(0).describe('Number of measurements taken in rural areas'),
  uniqueLocations: z.number().int().min(0).describe('Number of unique locations measured'),
  totalDistance: z.number().min(0).describe('Total distance covered in meters'),
  contributionScore: z.number().min(0).describe('Overall contribution score'),
  qualityScore: z.number().min(0).max(100).describe('Quality score percentage'),
  accuracyRate: z.number().min(0).max(100).describe('Accuracy rate percentage'),
  verifiedSpots: z.number().int().min(0).describe('Number of spots verified by others'),
  helpfulActions: z.number().int().min(0).describe('Number of helpful actions performed'),
  consecutiveDays: z.number().int().min(0).describe('Number of consecutive days active'),
  points: z.number().int().min(0).describe('Total points earned')
});

export const UserProgressSchema = z.object({
  points: z.number().int().min(0).describe('Total points earned'),
  level: z.number().int().min(0).describe('Current user level'),
  currentXP: z.number().int().min(0).describe('Current XP in this level'),
  nextLevelXP: z.number().int().min(0).describe('XP required for next level'),
  streak: z.object({
    current: z.number().int().min(0).describe('Current streak count'),
    longest: z.number().int().min(0).describe('Longest streak achieved')
  }).describe('User streak information'),
  stats: StatsContentSchema.describe('Detailed user statistics'),
  achievements: z.array(z.any()).optional().describe('List of user achievements')
});

export const UserStatsSchema = z.object({
  points: z.number().int().min(0).describe('Total points earned'),
  stats: StatsContentSchema.describe('Detailed user statistics')
}).strict();

export const MeasurementStatsSchema = z.object({
  isUnique: z.boolean().describe('Whether this is a unique location'),
  distance: z.number().min(0).describe('Distance from last measurement in meters'),
  contributionScore: z.number().min(0).describe('Contribution value of this measurement'),
  qualityScore: z.number().min(0).max(100).describe('Quality score of the measurement'),
  accuracy: z.number().min(0).max(100).optional().describe('Accuracy of the measurement')
}).strict();

export const MeasurementInputSchema = z.object({
  type: z.nativeEnum(MeasurementType).describe('Type of measurement'),
  value: z.number().describe('Measurement value'),
  latitude: z.number().min(-90).max(90).describe('Latitude coordinate'),
  longitude: z.number().min(-180).max(180).describe('Longitude coordinate'),
  isRural: z.boolean().describe('Whether the location is rural'),
  isFirstInArea: z.boolean().describe('Whether this is the first measurement in the area'),
  operator: z.string().optional().describe('Network operator if applicable'),
  quality: z.number().min(0).max(100).optional().describe('Signal quality percentage'),
  accuracy: z.number().min(0).max(100).optional().describe('GPS accuracy in meters'),
  stats: MeasurementStatsSchema.describe('Additional measurement statistics'),
  streak: z.number().int().min(0).describe('Current user streak at time of measurement')
}).strict();

export type ValidatedStatsContent = z.infer<typeof StatsContentSchema>;
export type ValidatedUserProgress = z.infer<typeof UserProgressSchema>;
export type ValidatedUserStats = z.infer<typeof UserStatsSchema>;
export type ValidatedMeasurementStats = z.infer<typeof MeasurementStatsSchema>;
export type ValidatedMeasurementInput = z.infer<typeof MeasurementInputSchema>;

// Leaderboard Types
export type LeaderboardResponse = {
  timeframe: TimeFrame;
  entries: LeaderboardEntry[];
  totalUsers: number;
  userRank?: number;
};

export type LeaderboardStats = {
  totalUsers: number;
  totalContributions: number;
  userRank?: number;
  userPoints?: number;
};

// Type Guards
export function isValidStatsContent(data: unknown): data is StatsContent {
  return StatsContentSchema.safeParse(data).success;
}

export function isValidMeasurementInput(data: unknown): data is ValidatedMeasurementInput {
  return MeasurementInputSchema.safeParse(data).success;
}

// Helper Functions
export function statsToJson(stats: StatsContent): Prisma.JsonValue {
  return JSON.parse(JSON.stringify(stats));
}

export function jsonToStats(json: Prisma.JsonValue): StatsContent {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid JSON for stats');
  }
  return StatsContentSchema.parse(json);
}
