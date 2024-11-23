import { prisma } from '@/lib/prisma';
import type {
  Achievement,
  UserProgress,
  UserStats,
  LeaderboardEntry,
  Measurement,
} from '@prisma/client';
import {
  validateUserProgress,
  validateUserStats,
  validateLeaderboardEntry,
  userIdSchema,
  achievementIdSchema,
  handleValidationError,
} from './validation';

export class GamificationDB {
  // User Progress Methods
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      userIdSchema.parse(userId);
      return prisma.userProgress.findUnique({
        where: { userId },
        include: {
          stats: true,
          achievements: true,
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  async createOrUpdateUserProgress(
    userId: string,
    data: {
      level: number;
      currentXP: number;
      totalXP: number;
      streak: number;
      lastActive: Date;
    }
  ): Promise<UserProgress> {
    try {
      userIdSchema.parse(userId);
      validateUserProgress(data);
      
      return prisma.userProgress.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  // User Stats Methods
  async updateUserStats(
    userId: string,
    stats: Partial<Omit<UserStats, 'id' | 'userId'>>
  ): Promise<UserStats> {
    try {
      userIdSchema.parse(userId);
      validateUserStats(stats);

      return prisma.userStats.upsert({
        where: { userId },
        update: stats,
        create: {
          userId,
          totalMeasurements: stats.totalMeasurements || 0,
          ruralMeasurements: stats.ruralMeasurements || 0,
          uniqueLocations: stats.uniqueLocations || 0,
          totalDistance: stats.totalDistance || 0,
          contributionScore: stats.contributionScore || 0,
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  // Achievement Methods
  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<Achievement> {
    try {
      userIdSchema.parse(userId);
      achievementIdSchema.parse(achievementId);

      // Check if achievement is already unlocked
      const existing = await prisma.achievement.findFirst({
        where: { userId, achievementId },
      });

      if (existing) {
        throw new Error('Achievement already unlocked');
      }

      return prisma.achievement.create({
        data: {
          userId,
          achievementId,
          unlockedAt: new Date(),
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      userIdSchema.parse(userId);
      return prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  // Leaderboard Methods
  async updateLeaderboardEntry(
    userId: string,
    data: {
      score: number;
      rank?: number;
      timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime';
    }
  ): Promise<LeaderboardEntry> {
    try {
      userIdSchema.parse(userId);
      validateLeaderboardEntry(data);

      return prisma.leaderboardEntry.upsert({
        where: {
          userId_timeframe: {
            userId,
            timeframe: data.timeframe,
          },
        },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  async getLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
    limit = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      if (limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }

      return prisma.leaderboardEntry.findMany({
        where: { timeframe },
        orderBy: { score: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  // Measurement Processing Methods
  async processMeasurement(
    measurement: Measurement,
    userId: string
  ): Promise<void> {
    try {
      userIdSchema.parse(userId);

      // Start a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Update user stats
        const stats = await tx.userStats.findUnique({ where: { userId } });
        const isRural = measurement.isRural ?? false;
        
        const newStats = {
          totalMeasurements: (stats?.totalMeasurements ?? 0) + 1,
          ruralMeasurements: isRural ? (stats?.ruralMeasurements ?? 0) + 1 : (stats?.ruralMeasurements ?? 0),
          contributionScore: (stats?.contributionScore ?? 0) + (isRural ? 2 : 1),
        };

        validateUserStats(newStats);
        
        await tx.userStats.upsert({
          where: { userId },
          update: newStats,
          create: {
            userId,
            ...newStats,
            uniqueLocations: 1,
            totalDistance: 0,
          },
        });

        // Update user progress
        const progress = await tx.userProgress.findUnique({ where: { userId } });
        const xpGained = isRural ? 20 : 10;
        
        const newProgress = {
          currentXP: (progress?.currentXP ?? 0) + xpGained,
          totalXP: (progress?.totalXP ?? 0) + xpGained,
          level: progress?.level ?? 1,
          streak: progress?.streak ?? 1,
          lastActive: new Date(),
        };

        validateUserProgress(newProgress);
        
        await tx.userProgress.upsert({
          where: { userId },
          update: newProgress,
          create: {
            userId,
            ...newProgress,
          },
        });
      });
    } catch (error) {
      handleValidationError(error);
    }
  }

  // Utility Methods
  async calculateUserRank(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ): Promise<number> {
    try {
      userIdSchema.parse(userId);

      const userScore = await prisma.leaderboardEntry.findUnique({
        where: {
          userId_timeframe: {
            userId,
            timeframe,
          },
        },
      });

      if (!userScore) return 0;

      const higherScores = await prisma.leaderboardEntry.count({
        where: {
          timeframe,
          score: {
            gt: userScore.score,
          },
        },
      });

      return higherScores + 1;
    } catch (error) {
      handleValidationError(error);
    }
  }
}
