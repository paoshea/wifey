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
  unlockedAt?: Date | null;
  progress?: number;
  target?: number;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userProgressId: string;
  progress: number;
  target?: number;
  unlockedAt?: Date | null;
  notifiedAt?: Date | null;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: Date | null;
}

export interface UserProgress {
  totalPoints: number;
  level: number;
  achievements: string[];  // Achievement IDs
  stats: {
    totalMeasurements: number;
    ruralMeasurements: number;
    verifiedSpots: number;
    helpfulActions: number;
    consecutiveDays: number;
    lastMeasurementDate: string;
  };
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
