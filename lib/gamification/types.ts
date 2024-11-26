import { z } from 'zod';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AchievementCategory = 
  | 'COVERAGE_PIONEER'    // First to map an area
  | 'RURAL_EXPLORER'      // Mapping rural areas
  | 'CONSISTENT_MAPPER'   // Regular contributions
  | 'COVERAGE_EXPERT'     // High quality measurements
  | 'COMMUNITY_HELPER'    // Helping others find coverage
  | 'WIFI_SCOUT'          // Finding WiFi hotspots
  | 'NETWORK_VALIDATOR'   // Verifying others' measurements
  | 'COVERAGE_CHAMPION';  // Top contributor

export type AchievementRarity = 'common' | 'rare' | 'epic';

export type AchievementRequirementType = 
  | 'measurements'
  | 'rural_measurements'
  | 'verified_spots'
  | 'helping_others'
  | 'consistency';

export interface AchievementRequirement {
  type: string;
  value: number;
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  metric: string;
  description?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: AchievementRarity;
  tier: AchievementTier;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  target?: number;
  progress?: number;
  unlockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userProgressId: string;
  progress: number;
  target?: number;
  unlockedAt?: Date | null;
  notifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: Date | null;
}

export interface UserProgress {
  id: string;
  userId: string;
  totalPoints: number;
  level: number;
  currentXP: number;
  totalXP: number;
  nextLevelXP: number;
  streak: number;
  lastActive: Date;
  unlockedAchievements: number;
  lastAchievementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalMeasurements: number;
    ruralMeasurements: number;
    uniqueLocations: number;
    totalDistance: number;
    contributionScore: number;
    verifiedSpots: number;
    helpfulActions: number;
    consecutiveDays: number;
    qualityScore: number;
    accuracyRate: number;
  };
}

export interface UserStats {
  id: string;
  userProgressId: string;
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
  verifiedSpots: number;
  helpfulActions: number;
  consecutiveDays: number;
  qualityScore: number;
  accuracyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContributionReward {
  points: number;
  bonuses: {
    ruralArea?: number;
    firstInArea?: number;
    consistencyStreak?: number;
    qualityBonus?: number;
  };
  achievements: Achievement[];
  levelUp?: {
    newLevel: number;
    rewards: string[];
  };
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  level: number;
  topAchievements: Achievement[];
  rank: number;
  avatarUrl?: string;
}

// Zod schemas for validation
export const AchievementRequirementSchema = z.object({
  type: z.string(),
  value: z.number(),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']).optional(),
  metric: z.string(),
  description: z.string().optional()
});

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  points: z.number(),
  rarity: z.enum(['common', 'rare', 'epic']),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  category: z.enum([
    'COVERAGE_PIONEER', 
    'RURAL_EXPLORER', 
    'CONSISTENT_MAPPER', 
    'COVERAGE_EXPERT', 
    'COMMUNITY_HELPER', 
    'WIFI_SCOUT', 
    'NETWORK_VALIDATOR', 
    'COVERAGE_CHAMPION'
  ]),
  requirements: z.array(AchievementRequirementSchema),
  target: z.number().optional(),
  progress: z.number().optional(),
  unlockedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ValidatedAchievement = z.infer<typeof AchievementSchema>;
