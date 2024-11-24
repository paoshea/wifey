import { PrismaClient, Prisma } from '@prisma/client';
import { monitoringService } from '../../monitoring/monitoring-service';
import type {
  Achievement,
  UserProgress,
  UserStats,
  LeaderboardEntry,
  User,
  Prisma as PrismaTypes,
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

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';

interface BaseUserStats {
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
}

type UserStatsData = Omit<PrismaTypes.UserStatsCreateInput, 'id' | 'userId' | 'user'> & BaseUserStats;

interface BaseUserProgress {
  level: number;
  currentXP: number;
  totalXP: number;
  streak: number;
  lastActive: Date;
}

type UserProgressData = Omit<PrismaTypes.UserProgressCreateInput, 'id' | 'userId' | 'user' | 'achievements'> & BaseUserProgress;

interface MeasurementData {
  isRural: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface LeaderboardData {
  score: number;
  rank?: number | null;
  timeframe: TimeFrame;
}

interface RankHistoryEntry {
  rank: number;
  date: Date;
}

function calculateUpdatedStats(currentStats: UserStats, measurement: MeasurementData): Partial<UserStatsData> {
  const isRural = measurement.isRural ?? false;
  return {
    totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
    ruralMeasurements: isRural ? (currentStats.ruralMeasurements || 0) + 1 : (currentStats.ruralMeasurements || 0),
    contributionScore: (currentStats.contributionScore || 0) + (isRural ? 2 : 1),
  };
}

function calculateUpdatedProgress(currentProgress: UserProgress, measurement: MeasurementData): Partial<UserProgressData> {
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
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // User Progress Methods
  async getUserProgress(userId: string): Promise<UserProgress & { 
    stats: UserStats; 
    achievements: Achievement[];
  }> {
    try {
      userIdSchema.parse(userId);
      const progress = await this.prisma.userProgress.findUnique({
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

  public async updateUserProgress(userId: string, points: number): Promise<void> {
    const tracker = monitoringService.startPerformanceTracking('updateUserProgress', userId);
    try {
      const userProgress = await this.prisma.userProgress.findUnique({
        where: { userId }
      });

      if (!userProgress) {
        throw new Error(`User progress not found for userId: ${userId}`);
      }

      const newTotalPoints = userProgress.totalPoints + points;
      const newCurrentXP = userProgress.currentXP + points;
      const { level, nextLevelXP } = this.calculateNewLevel(newCurrentXP);

      await this.prisma.userProgress.update({
        where: { userId },
        data: {
          totalPoints: newTotalPoints,
          totalXP: userProgress.totalXP + points,
          currentXP: newCurrentXP,
          level,
          nextLevelXP,
          lastActive: new Date()
        }
      });

      tracker.addMetadata({ 
        pointsAdded: points,
        newTotal: newTotalPoints,
        newLevel: level 
      });
      await tracker.end(true);
    } catch (error) {
      await tracker.end(false);
      await monitoringService.logError(error, 'error', userId, { points });
      throw error;
    }
  }

  private calculateNewLevel(currentXP: number): { level: number; nextLevelXP: number } {
    const tracker = monitoringService.startPerformanceTracking('calculateNewLevel');
    try {
      const baseXP = 100;
      const multiplier = 1.5;
      let level = 1;
      let xpRequired = baseXP;

      while (currentXP >= xpRequired) {
        level++;
        xpRequired = Math.floor(baseXP * Math.pow(multiplier, level - 1));
      }

      tracker.addMetadata({ 
        currentXP,
        calculatedLevel: level,
        nextLevelXP: xpRequired 
      });
      tracker.end(true);
      return { level, nextLevelXP: xpRequired };
    } catch (error) {
      tracker.end(false);
      monitoringService.logError(error, 'error', undefined, { currentXP });
      throw error;
    }
  }

  async createOrUpdateUserProgress(
    userId: string,
    data: Partial<UserProgressData>
  ): Promise<UserProgress> {
    try {
      userIdSchema.parse(userId);
      validateUserProgress(data);
      
      const progress = await this.prisma.userProgress.upsert({
        where: { userId },
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

      const updatedStats = await this.prisma.userStats.upsert({
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

      const existing = await this.prisma.achievement.findFirst({
        where: { 
          userId,
          achievementId,
        },
      });

      if (existing) {
        return existing;
      }

      const achievement = await this.prisma.achievement.create({
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
      const achievements = await this.prisma.achievement.findMany({
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
    data: LeaderboardData
  ): Promise<LeaderboardEntry> {
    try {
      userIdSchema.parse(userId);
      validateLeaderboardEntry(data);

      const entry = await this.prisma.leaderboardEntry.upsert({
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
    timeframe: TimeFrame,
    limit = 100
  ): Promise<Array<LeaderboardEntry & { user: Pick<User, 'name' | 'image'> }>> {
    try {
      if (limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }

      const entries = await this.prisma.leaderboardEntry.findMany({
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

      return entries ?? [];
    } catch (error) {
      handleValidationError(error);
      throw error;
    }
  }

  // Measurement Processing Methods
  async processMeasurement(
    userId: string,
    measurement: MeasurementData,
    tx?: Prisma.TransactionClient
  ): Promise<{
    stats: UserStats;
    progress: UserProgress;
  }> {
    try {
      userIdSchema.parse(userId);
      validateMeasurement(measurement);

      const prismaClient = tx || this.prisma;

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
    prismaClient: PrismaClient | Prisma.TransactionClient
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
    timeframe: TimeFrame,
    limit = 30
  ): Promise<RankHistoryEntry[]> {
    try {
      userIdSchema.parse(userId);
      if (limit < 1 || limit > 90) {
        throw new Error('History limit must be between 1 and 90 days');
      }

      const entries = await this.prisma.rankHistory.findMany({
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
    timeframe: TimeFrame,
    rank: number
  ): Promise<void> {
    try {
      userIdSchema.parse(userId);
      if (rank < 1) {
        throw new Error('Rank must be positive');
      }

      await this.prisma.rankHistory.create({
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
  public async calculateUserRank(
    userId: string,
    timeframe: TimeFrame = 'allTime'
  ): Promise<number> {
    const tracker = monitoringService.startPerformanceTracking('calculateUserRank', userId);
    try {
      const userProgress = await this.prisma.userProgress.findUnique({
        where: { userId },
        select: { totalPoints: true }
      });

      if (!userProgress) {
        throw new Error(`User progress not found for userId: ${userId}`);
      }

      const rank = await this.prisma.userProgress.count({
        where: {
          totalPoints: {
            gt: userProgress.totalPoints
          }
        }
      });

      // Store rank history
      await this.prisma.rankHistory.create({
        data: {
          userId,
          rank: rank + 1,
          timeframe
        }
      });

      tracker.addMetadata({ timeframe, rank: rank + 1 });
      await tracker.end(true);
      return rank + 1;
    } catch (error) {
      await tracker.end(false);
      await monitoringService.logError(error, 'error', userId, { timeframe });
      throw error;
    }
  }
}
