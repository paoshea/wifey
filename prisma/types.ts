import { Prisma, PrismaClient } from '@prisma/client';

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export type AchievementCategory = 'CONTRIBUTION' | 'STREAK' | 'QUALITY' | 'VERIFICATION' | 'SECRET';
export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface AchievementRequirement {
  type: 'MEASUREMENT_COUNT' | 'RURAL_MEASUREMENTS' | 'VERIFICATIONS' | 'ACCURACY_RATE' | 'CONSECUTIVE_DAYS' | 'TIME_BASED';
  threshold?: number;
  startHour?: number;
  endHour?: number;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  preferredLanguage: string;
  image?: string;
  emailVerified?: Date;
}

export interface UserProgressInput {
  user: {
    connect: {
      id: string;
    };
  };
  level: number;
  currentXP: number;
  totalXP: number;
  totalPoints: number;
  nextLevelXP: number;
  streak: number;
  unlockedAchievements: number;
  lastAchievementAt?: Date;
  stats: {
    create: {
      totalMeasurements: number;
      ruralMeasurements: number;
      verifiedSpots: number;
      helpfulActions: number;
      consecutiveDays: number;
      qualityScore: number;
      accuracyRate: number;
      uniqueLocations: number;
      totalDistance: number;
      contributionScore: number;
    };
  };
  streaks: {
    create: {
      currentStreak: number;
    };
  };
}

export interface WifiHotspotInput {
  name: string;
  location: {
    type: string;
    coordinates: number[];
  };
  provider: string;
  speed?: string;
  isPublic: boolean;
}

export interface AchievementInput {
  category: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  tier: string;
  requirements: {
    type: string;
    threshold?: number;
    startHour?: number;
    endHour?: number;
  };
  isSecret: boolean;
}
