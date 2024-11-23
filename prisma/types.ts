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

export type AchievementInput = Omit<Prisma.AchievementCreateInput, 'userAchievements'> & {
  requirements: AchievementRequirement;
};

export type WifiHotspotInput = Omit<Prisma.WifiHotspotCreateInput, 'id'> & {
  location: GeoPoint;
};

export type UserInput = Prisma.UserCreateInput;
export type UserProgressInput = Prisma.UserProgressCreateInput;
export type UserStatsInput = Prisma.UserStatsCreateInput;
export type UserStreakInput = Prisma.UserStreakCreateInput;
