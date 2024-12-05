import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Keep all existing enums and interfaces until AchievementProgress
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

// Achievement Tier Colors
export const TierColors = {
  [AchievementTier.COMMON]: 'gray',
  [AchievementTier.RARE]: 'blue',
  [AchievementTier.EPIC]: 'purple',
  [AchievementTier.LEGENDARY]: 'orange'
} as const;

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

// Base interfaces
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

// User Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  level: number;
  totalPoints: number;
  streak: number;
  unlockedAchievements: number;
  achievements: AchievementProgress[];
  createdAt: Date;
  updatedAt: Date;
}

// Updated AchievementProgress interface with all required properties
export interface AchievementProgress {
  id: string;
  progress: number;
  completed: boolean;
  target: number;
  unlockedAt: Date | null;
  createdAt: Date;
  achievement?: Achievement;
  isCompleted?: boolean;  // For filterAchievements function
}

export interface ValidatedUserStats {
  id: string;
  userProgressId: string;
  stats: StatsContent;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement Types
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

// Leaderboard Types
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

export interface LeaderboardStats {
  totalUsers: number;
  totalContributions: number;
  userRank?: number;
  userPoints?: number;
}

// Achievement Filter Types
export interface AchievementFilter {
  completed?: boolean;
  tier?: AchievementTier;
}

export type SortOption = 'tier' | 'progress' | 'date';

// Activity Data Types
export interface ActivityData {
  date: Date | string;
  measurements: number;
  rural: number;
}

export interface FormattedActivityData {
  date: string;
  value: number;
  ruralValue: number;
}

// Measurement Types
export interface MeasurementResult {
  id: string;
  userId: string;
  type: MeasurementType;
  value: number;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

// Type Guards
export function isValidAchievement(achievement: any): achievement is ValidatedAchievement {
  return (
    achievement &&
    typeof achievement.id === 'string' &&
    typeof achievement.title === 'string' &&
    typeof achievement.description === 'string' &&
    typeof achievement.points === 'number' &&
    Array.isArray(achievement.requirements)
  );
}

export function isValidUserProgress(progress: any): progress is UserProgress {
  return (
    progress &&
    typeof progress.id === 'string' &&
    typeof progress.userId === 'string' &&
    typeof progress.level === 'number' &&
    typeof progress.totalPoints === 'number' &&
    Array.isArray(progress.achievements)
  );
}

export function isValidUserStats(stats: any): stats is ValidatedUserStats {
  return (
    stats &&
    typeof stats.id === 'string' &&
    typeof stats.userProgressId === 'string' &&
    stats.stats &&
    typeof stats.stats === 'object'
  );
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

export const UserProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  level: z.number(),
  totalPoints: z.number(),
  streak: z.number(),
  unlockedAchievements: z.number(),
  achievements: z.array(z.object({
    id: z.string(),
    progress: z.number(),
    completed: z.boolean(),
    unlockedAt: z.date().nullable()
  })),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserStatsSchema = z.object({
  id: z.string(),
  userProgressId: z.string(),
  stats: StatsContentSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

export const MeasurementInputSchema = z.object({
  type: z.nativeEnum(MeasurementType),
  value: z.number(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional()
  }),
  timestamp: z.date().default(() => new Date())
});

// Helper Functions
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
