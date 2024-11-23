export type AchievementCategory = 
  | 'COVERAGE_PIONEER'    // First to map an area
  | 'RURAL_EXPLORER'      // Mapping rural areas
  | 'CONSISTENT_MAPPER'   // Regular contributions
  | 'COVERAGE_EXPERT'     // High quality measurements
  | 'COMMUNITY_HELPER'    // Helping others find coverage
  | 'WIFI_SCOUT'          // Finding WiFi hotspots
  | 'NETWORK_VALIDATOR'   // Verifying others' measurements
  | 'COVERAGE_CHAMPION';  // Top contributor

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic';
  progress: number;
  target: number;
  completed: boolean;
  earnedDate?: string;
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

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  level: number;
  topAchievements: Achievement[];
  rank: number;
  avatarUrl?: string;
}

export interface ContributionReward {
  points: number;
  bonuses: {
    ruralArea?: number;
    firstInArea?: number;
    consistencyStreak?: number;
    qualityBonus?: number;
  };
  achievements?: Achievement[];
  levelUp?: {
    newLevel: number;
    rewards: string[];
  };
}
