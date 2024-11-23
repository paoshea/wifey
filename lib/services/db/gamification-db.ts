import { PrismaClient, PrismaTransaction } from '@prisma/client';
import type {
  Achievement,
  UserProgress,
  UserStats,
  LeaderboardEntry,
  Measurement,
  User,
  MeasurementData,
} from '@prisma/client';
import {
  validateUserProgress,
  validateUserStats,
  validateLeaderboardEntry,
  userIdSchema,
  achievementIdSchema,
  handleValidationError,
  validateMeasurement,
} from './validation';

const prisma = new PrismaClient();

interface UserStatsData extends Omit<UserStats, 'id' | 'userId'> {
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
}

interface UserProgressData extends Omit<UserProgress, 'id' | 'userId'> {
  level: number;
  currentXP: number;
  totalXP: number;
  streak: number;
  lastActive: Date;
}

interface MeasurementData {
  isRural: boolean;
}

function calculateUpdatedStats(currentStats: UserStats, measurement: MeasurementData): Partial<UserStatsData> {
  const isRural = measurement.isRural ?? false;
  return {
    totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
    ruralMeasurements: isRural ? (currentStats.ruralMeasurements || 0) + 1 : (currentStats.ruralMeasurements || 0),
    contributionScore: (currentStats.contributionScore || 0) + (isRural ? 2 : 1),
  };
}

function calculateUpdatedProgress(currentProgress: UserProgress, measurement: MeasurementData): UserProgressData {
  const xpGained = measurement.isRural ? 20 : 10;
  return {
    currentXP: (currentProgress.currentXP || 0) + xpGained,
    totalXP: (currentProgress.totalXP || 0) + xpGained,
    level: currentProgress.level || 1,
    streak: currentProgress.streak || 1,
    lastActive: new Date(),
  };
}

function determineEligibleAchievements(stats: UserStats, progress: UserProgress): string[] {
  // TO DO: implement logic to determine eligible achievements
  return [];
}

export class GamificationDB {
  // User Progress Methods
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      userIdSchema.parse(userId);
      const progress = await prisma.userProgress.findUnique({
        where: { userId },
        include: {
          stats: true,
          achievements: true,
        },
      });
      if (!progress) {
        throw new Error(`User progress not found for user ${userId}`);
      }
      return progress;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  async createOrUpdateUserProgress(
    userId: string,
    data: UserProgressData
  ): Promise<UserProgress> {
    try {
      userIdSchema.parse(userId);
      validateUserProgress(data);
      
      const progress = await prisma.userProgress.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
      if (!progress) {
        throw new Error(`Failed to create or update user progress for user ${userId}`);
      }
      return progress;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  // User Stats Methods
  async updateUserStats(
    userId: string,
    stats: Partial<UserStatsData>
  ): Promise<UserStats> {
    try {
      userIdSchema.parse(userId);
      validateUserStats(stats);

      const defaultStats: UserStatsData = {
        totalMeasurements: 0,
        ruralMeasurements: 0,
        uniqueLocations: 0,
        totalDistance: 0,
        contributionScore: 0,
      };

      const updatedStats = await prisma.userStats.upsert({
        where: { userId },
        update: {
          ...stats,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...defaultStats,
          ...stats,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!updatedStats) {
        throw new Error(`Failed to update stats for user ${userId}`);
      }

      return updatedStats;
    } catch (error) {
      handleValidationError(error);
      throw error;
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

      const existing = await prisma.achievement.findFirst({
        where: { 
          userId,
          achievementId,
        },
      });

      if (existing) {
        return existing;
      }

      const achievement = await prisma.achievement.create({
        data: {
          userId,
          achievementId,
          unlockedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!achievement) {
        throw new Error(`Failed to create achievement for user ${userId}`);
      }

      return achievement;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      userIdSchema.parse(userId);
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      });
      return achievements;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  // Leaderboard Methods
  async updateLeaderboardEntry(
    userId: string,
    data: {
      score: number;
      rank?: number | null;
      timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime';
    }
  ): Promise<LeaderboardEntry> {
    try {
      userIdSchema.parse(userId);
      validateLeaderboardEntry(data);

      const entry = await prisma.leaderboardEntry.upsert({
        where: {
          userId_timeframe: {
            userId,
            timeframe: data.timeframe,
          },
        },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!entry) {
        throw new Error(`Failed to update leaderboard entry for user ${userId}`);
      }

      return entry;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  async getLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
    limit = 100
  ): Promise<Array<LeaderboardEntry & { user: Pick<User, 'name' | 'image'> }>> {
    try {
      if (limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }

      const entries = await prisma.leaderboardEntry.findMany({
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

      if (!entries) {
        return [];
      }

      return entries;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  // Measurement Processing Methods
  async processMeasurement(
    userId: string,
    measurement: MeasurementData,
    tx?: PrismaTransaction
  ): Promise<{
    stats: UserStats;
    progress: UserProgress;
  }> {
    try {
      userIdSchema.parse(userId);
      validateMeasurement(measurement);

      const prismaClient = tx || prisma;

      // Calculate new stats based on measurement
      const currentStats = await prismaClient.userStats.findUnique({
        where: { userId },
      });

      if (!currentStats) {
        throw new Error(`Stats not found for user ${userId}`);
      }

      const newStats = calculateUpdatedStats(currentStats, measurement);
      validateUserStats(newStats);

      const updatedStats = await prismaClient.userStats.update({
        where: { userId },
        data: {
          ...newStats,
          updatedAt: new Date(),
        },
      });

      if (!updatedStats) {
        throw new Error(`Failed to update stats for user ${userId}`);
      }

      // Update progress
      const currentProgress = await prismaClient.userProgress.findUnique({
        where: { userId },
      });

      if (!currentProgress) {
        throw new Error(`Progress not found for user ${userId}`);
      }

      const newProgress = calculateUpdatedProgress(currentProgress, measurement);
      validateUserProgress(newProgress);

      const updatedProgress = await prismaClient.userProgress.update({
        where: { userId },
        data: {
          ...newProgress,
          updatedAt: new Date(),
        },
      });

      if (!updatedProgress) {
        throw new Error(`Failed to update progress for user ${userId}`);
      }

      // Check and update achievements
      await this.checkAndUpdateAchievements(userId, updatedStats, updatedProgress, prismaClient);

      return {
        stats: updatedStats,
        progress: updatedProgress,
      };
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  private async checkAndUpdateAchievements(
    userId: string,
    stats: UserStats,
    progress: UserProgress,
    prismaClient: PrismaClient | PrismaTransaction
  ): Promise<void> {
    try {
      const eligibleAchievements = determineEligibleAchievements(stats, progress);
      
      for (const achievementId of eligibleAchievements) {
        const existing = await prismaClient.achievement.findFirst({
          where: {
            userId,
            achievementId,
          },
        });

        if (!existing) {
          await prismaClient.achievement.create({
            data: {
              userId,
              achievementId,
              unlockedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  async getUserRankHistory(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
    limit = 30
  ): Promise<Array<{ rank: number; date: Date }>> {
    try {
      userIdSchema.parse(userId);
      if (limit < 1 || limit > 90) {
        throw new Error('History limit must be between 1 and 90 days');
      }

      const entries = await prisma.rankHistory.findMany({
        where: {
          userId,
          timeframe,
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
        select: {
          rank: true,
          date: true,
        },
      });

      return entries;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  async updateRankHistory(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime',
    rank: number
  ): Promise<void> {
    try {
      userIdSchema.parse(userId);
      if (rank < 1) {
        throw new Error('Rank must be positive');
      }

      await prisma.rankHistory.create({
        data: {
          userId,
          timeframe,
          rank,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  // Utility Methods
  async calculateUserRank(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'
  ): Promise<number> {
    try {
      userIdSchema.parse(userId);

      const userEntry = await prisma.leaderboardEntry.findUnique({
        where: {
          userId_timeframe: {
            userId,
            timeframe,
          },
        },
        select: {
          score: true,
        },
      });

      if (!userEntry) {
        return 0;
      }

      const higherScores = await prisma.leaderboardEntry.count({
        where: {
          timeframe,
          score: {
            gt: userEntry.score,
          },
        },
      });

      return higherScores + 1;
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }
}
