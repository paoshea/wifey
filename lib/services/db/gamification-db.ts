// lib/services/db/gamification-db.ts

import { PrismaClient, Prisma, User, Achievement, UserStreak, WifiSpot, CoverageReport } from '@prisma/client';
import { monitoringService } from '../../monitoring/monitoring-service';
import {
  validateUserProgress,
  validateMeasurement,
  userIdSchema,
  achievementIdSchema,
  handleValidationError,
} from './validation';
import {
  RequirementType,
  RequirementOperator,
  StatsContent,
  isValidStatsContent,
  AchievementTier,
  ValidatedAchievement,
  UserStreakWhereUniqueInput,
  TimeFrame
} from '../../gamification/types';

const prisma = new PrismaClient();

interface Requirement {
  type: RequirementType;
  value: number;
  description: string;
  metric: string;
  operator: RequirementOperator;
}

interface UserProgress {
  points: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: {
    current: number;
    longest: number;
  };
  stats: Prisma.JsonValue;
}

interface MeasurementData {
  type: 'wifi' | 'coverage';
  value: number;
  location?: {
    lat: number;
    lng: number;
  };
  quality?: number;
  operator?: string;
  device?: {
    type: string;
    model: string;
    os: string;
  };
}

interface LeaderboardEntry {
  userId: string;
  points: number;
  rank: number;
  timeframe: TimeFrame;
  user: {
    name: string | null;
    id: string;
  };
}

const defaultStats: StatsContent = {
  totalMeasurements: 0,
  ruralMeasurements: 0,
  uniqueLocations: 0,
  totalDistance: 0,
  contributionScore: 0,
  qualityScore: 0,
  accuracyRate: 0,
  verifiedSpots: 0,
  helpfulActions: 0,
  consecutiveDays: 0
};

export class GamificationDB {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // User Progress Methods
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          streaks: true,
          achievements: true,
        },
      });

      if (!user) return null;

      const streak = user.streaks[0] || { current: 0, longest: 0 };
      
      return {
        points: user.points,
        level: Math.floor(Math.sqrt(user.points / 100)) + 1,
        currentXP: user.points % 100,
        nextLevelXP: (Math.floor(Math.sqrt(user.points / 100)) + 2) * 100,
        streak: {
          current: streak.current,
          longest: streak.longest,
        },
        stats: defaultStats,
      };
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async updateUserProgress(userId: string, points: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: points },
        },
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  // Achievement Methods
  async unlockAchievement(userId: string, achievementId: string): Promise<Achievement> {
    try {
      return await this.prisma.achievement.update({
        where: {
          id: achievementId,
          userId: userId,
        },
        data: {
          unlockedAt: new Date(),
        },
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      return await this.prisma.achievement.findMany({
        where: { userId },
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  // Measurement Processing Methods
  async processMeasurement(
    userId: string,
    measurement: MeasurementData,
  ): Promise<{
    points: number;
    achievements: Achievement[];
  }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Update user points based on measurement type
        const pointsEarned = measurement.type === 'wifi' ? 10 : 5;

        // Create the appropriate record
        if (measurement.type === 'wifi' && measurement.location) {
          await tx.wifiSpot.create({
            data: {
              name: 'WiFi Spot',
              latitude: measurement.location.lat,
              longitude: measurement.location.lng,
              signal: measurement.value,
              points: pointsEarned,
              userId,
            },
          });
        } else if (measurement.type === 'coverage' && measurement.location && measurement.operator) {
          await tx.coverageReport.create({
            data: {
              operator: measurement.operator as Prisma.OperatorType,
              latitude: measurement.location.lat,
              longitude: measurement.location.lng,
              signal: measurement.value,
              points: pointsEarned,
              userId,
            },
          });
        }

        // Update user points
        await tx.user.update({
          where: { id: userId },
          data: {
            points: { increment: pointsEarned },
          },
        });

        // Check for new achievements
        const achievements = await tx.achievement.findMany({
          where: { userId, unlockedAt: null },
        });

        return {
          points: pointsEarned,
          achievements,
        };
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  // Leaderboard Methods
  async getLeaderboard(
    timeframe: TimeFrame = 'allTime',
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const users = await this.prisma.user.findMany({
        take: limit,
        orderBy: {
          points: 'desc',
        },
        select: {
          id: true,
          name: true,
          points: true,
        },
      });

      return users.map((user, index) => ({
        userId: user.id,
        points: user.points,
        rank: index + 1,
        timeframe,
        user: {
          name: user.name,
          id: user.id,
        },
      }));
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async calculateUserRank(userId: string): Promise<number> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user) return 0;

      const higherRankedUsers = await this.prisma.user.count({
        where: {
          points: {
            gt: user.points,
          },
        },
      });

      return higherRankedUsers + 1;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }
}

export const gamificationDB = new GamificationDB();
