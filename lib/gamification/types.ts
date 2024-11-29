import { z } from 'zod';
import { Prisma, type Achievement, type UserProgress } from '@prisma/client';

// Core Enums
export enum MeasurementType {
  WIFI = 'WIFI',
  COVERAGE = 'COVERAGE'
}

export enum TimeFrame {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME'
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
  totalMeasurements: z.number().int().min(0),
  ruralMeasurements: z.number().int().min(0),
  uniqueLocations: z.number().int().min(0),
  totalDistance: z.number().min(0),
  contributionScore: z.number().min(0),
  qualityScore: z.number().min(0).max(100),
  accuracyRate: z.number().min(0).max(100),
  verifiedSpots: z.number().int().min(0),
  helpfulActions: z.number().int().min(0),
  consecutiveDays: z.number().int().min(0),
  points: z.number().int().min(0)
});

export const MeasurementStatsSchema = z.object({
  isUnique: z.boolean(),
  distance: z.number().min(0),
  contributionScore: z.number().min(0),
  qualityScore: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100).optional()
});

export const ValidatedMeasurementInputSchema = z.object({
  type: z.nativeEnum(MeasurementType),
  value: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  isRural: z.boolean(),
  isFirstInArea: z.boolean(),
  operator: z.string().optional(),
  quality: z.number().min(0).max(100).optional(),
  accuracy: z.number().min(0).max(100).optional(),
  stats: MeasurementStatsSchema,
  streak: z.number().int().min(0)
});

// Type Guards
export function isValidStatsContent(data: unknown): data is StatsContent {
  return StatsContentSchema.safeParse(data).success;
}

export function isValidMeasurementInput(data: unknown): data is ValidatedMeasurementInput {
  return ValidatedMeasurementInputSchema.safeParse(data).success;
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
