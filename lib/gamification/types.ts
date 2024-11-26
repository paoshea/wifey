import { z } from 'zod';
import { Achievement as PrismaAchievement, UserStats as PrismaUserStats, UserProgress as PrismaUserProgress } from '@prisma/client';

// Enums
export enum RequirementType {
  MEASUREMENT_COUNT = 'MEASUREMENT_COUNT',
  RURAL_MEASUREMENTS = 'RURAL_MEASUREMENTS',
  CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
  ACCURACY_RATE = 'ACCURACY_RATE',
  VERIFICATIONS = 'VERIFICATIONS',
  TIME_BASED = 'TIME_BASED'
}

export enum RarityLevel {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic'
}

// Base requirement schema
export const BaseRequirementSchema = z.object({
  type: z.enum(['measurements', 'rural_measurements', 'verified_spots', 'helping_others', 'consistency']),
  value: z.number().positive(),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']).optional(),
  metric: z.string(),
  description: z.string().optional()
});

// Achievement schema
export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  points: z.number().positive(),
  rarity: z.enum(['common', 'rare', 'epic']),
  requirements: z.array(BaseRequirementSchema),
  target: z.number().nullable(),
  progress: z.number().optional(),
  unlockedAt: z.date().nullable().optional(),
  completed: z.boolean().optional(),
  earnedDate: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// User stats schema
export const UserStatsSchema = z.object({
  id: z.string(),
  userProgressId: z.string(),
  stats: z.object({
    totalMeasurements: z.number(),
    ruralMeasurements: z.number(),
    uniqueLocations: z.number(),
    totalDistance: z.number(),
    contributionScore: z.number(),
    verifiedSpots: z.number(),
    helpfulActions: z.number(),
    consecutiveDays: z.number(),
    qualityScore: z.number(),
    accuracyRate: z.number(),
    lastMeasurementDate: z.string().nullable()
  }),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Achievement progress schema
export const AchievementProgressSchema = z.object({
  achievement: AchievementSchema,
  progress: z.number().min(0),
  target: z.number().min(0),
  unlockedAt: z.date().nullable()
});

// Inferred types
export type Achievement = z.infer<typeof AchievementSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type AchievementProgress = z.infer<typeof AchievementProgressSchema>;
export type BaseRequirement = z.infer<typeof BaseRequirementSchema>;

// Achievement notification type
export interface AchievementNotification {
  achievement: Achievement;
  unlockedAt: Date;
  pointsEarned: number;
}

// Achievement requirement type
export type AchievementRequirementType = 
  | 'measurements'
  | 'rural_measurements'
  | 'verified_spots'
  | 'helping_others'
  | 'consistency';

// Achievement requirement
export interface AchievementRequirement {
  type: AchievementRequirementType;
  value: number;
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  metric: keyof UserStats['stats'];
  description?: string;
}

// User achievement
export interface UserAchievement {
  id: string;
  achievementId: string;
  userProgressId: string;
  progress: number;
  target: number | null;
  completed: boolean;
  unlockedAt: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  achievement?: Achievement;
}

// Contribution reward
export interface ContributionReward {
  points: number;
  bonuses?: {
    ruralArea?: number;
    firstInArea?: number;
    consistencyStreak?: number;
    qualityBonus?: number;
  };
  achievements: Achievement[];
  levelUp?: {
    newLevel: number;
    nextLevelXP: number;
  };
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  level: number;
  rank: number;
  topAchievements: Achievement[];
  avatarUrl?: string;
}
