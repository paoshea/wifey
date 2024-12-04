import { Prisma } from '@prisma/client';
import { z } from 'zod';

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

export enum AchievementTier {
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  COMMON = 'COMMON'
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

export enum StatsMetric {
  totalMeasurements = 'totalMeasurements',
  ruralMeasurements = 'ruralMeasurements',
  uniqueLocations = 'uniqueLocations',
  totalDistance = 'totalDistance',
  contributionScore = 'contributionScore',
  qualityScore = 'qualityScore',
  accuracyRate = 'accuracyRate',
  verifiedSpots = 'verifiedSpots',
  helpfulActions = 'helpfulActions',
  consecutiveDays = 'consecutiveDays',
  points = 'points'
}

export interface StatsData {
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
}

export interface StatsContent extends StatsData {
  points: number;
}

export interface Requirement {
  type: RequirementType;
  metric: StatsMetric;
  value: number;
  operator: RequirementOperator;
  description: string;
}

export interface RequirementData {
  type: string;
  metric: keyof StatsContent;
  value: number;
  operator: string;
  description?: string;
}

export interface AchievementRequirement {
  type: string;
  metric: keyof StatsContent;
  value: number;
  operator: RequirementOperator;
  description?: string;
  currentValue?: number;
}

export interface ValidatedRequirement extends AchievementRequirement {
  type: RequirementType;
  operator: RequirementOperator;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  type: string;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  progress: number;
  target: number;
  isCompleted: boolean;
  unlockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidatedAchievement extends Achievement {
  requirements: ValidatedRequirement[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  rank: number;
  measurements: number;
  lastActive: Date;
}

export interface LeaderboardEntry {
  id: string;
  timeframe: TimeFrame;
  points: number;
  rank: number;
  username: string;
  image?: string;
  level: number;
  contributions: number;
  badges: number;
  streak: {
    current: number;
    longest: number;
  };
  recentAchievements?: {
    id: string;
    title: string;
    icon: string;
  }[];
  user: LeaderboardUser;
}

export interface LeaderboardResponse {
  timeframe: TimeFrame;
  entries: LeaderboardEntry[];
  totalUsers: number;
  userRank?: number;
}

// Zod Schemas
export const RequirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.nativeEnum(StatsMetric),
  value: z.number(),
  operator: z.nativeEnum(RequirementOperator),
  description: z.string().optional(),
  currentValue: z.number().optional()
});

export const StatsContentSchema = z.object({
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
});

export const AchievementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number(),
  icon: z.string(),
  type: z.string(),
  tier: z.nativeEnum(AchievementTier),
  requirements: z.array(RequirementSchema),
  progress: z.number(),
  target: z.number(),
  isCompleted: z.boolean(),
  unlockedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserStatsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  points: z.number(),
  stats: StatsContentSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserProgressSchema = z.object({
  points: z.number(),
  level: z.number(),
  currentXP: z.number(),
  nextLevelXP: z.number(),
  streak: z.object({
    current: z.number(),
    longest: z.number()
  }),
  stats: StatsContentSchema,
  achievements: z.array(AchievementSchema).optional()
});

export const MeasurementInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  signalStrength: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  provider: z.string().optional(),
  connectionType: z.string().optional(),
  networkType: z.string().optional()
});

export const AchievementRequirementSchema = Prisma.validator<Prisma.JsonObject>()({
  type: true,
  metric: true,
  value: true,
  operator: true,
  description: true
});

export function jsonToStats(json: Prisma.JsonValue): StatsContent {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('Invalid JSON for stats');
  }

  const statsObj = json as Record<string, unknown>;

  return {
    points: Number(statsObj.points) || 0,
    totalMeasurements: Number(statsObj.totalMeasurements) || 0,
    ruralMeasurements: Number(statsObj.ruralMeasurements) || 0,
    uniqueLocations: Number(statsObj.uniqueLocations) || 0,
    totalDistance: Number(statsObj.totalDistance) || 0,
    contributionScore: Number(statsObj.contributionScore) || 0,
    qualityScore: Number(statsObj.qualityScore) || 0,
    accuracyRate: Number(statsObj.accuracyRate) || 0,
    verifiedSpots: Number(statsObj.verifiedSpots) || 0,
    helpfulActions: Number(statsObj.helpfulActions) || 0,
    consecutiveDays: Number(statsObj.consecutiveDays) || 0
  };
}

// Types derived from schemas
export type ValidatedMeasurementInput = z.infer<typeof MeasurementInputSchema>;
export type ValidatedUserProgress = z.infer<typeof UserProgressSchema>;
export type ValidatedUserStats = z.infer<typeof UserStatsSchema>;
