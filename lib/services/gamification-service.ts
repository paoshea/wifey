// lib/services/gamification-service.ts

import { PrismaClient, Achievement, UserProgress, UserStats, Prisma } from '@prisma/client';
import { calculateProgress, validateAchievement, checkRequirementMet } from '../gamification/validation';
import {
  StatsContent,
  ValidatedLeaderboardEntry,
  ValidatedUserStats,
  ValidatedAchievement,
  AchievementTier,
  LeaderboardEntrySchema,
  AchievementSchema,
  StatsContentSchema,
  UserProgressSchema,
  ValidatedUserProgress,
  isValidStatsContent,
  StatsMetric,
  Requirement
} from '../gamification/types';
import { apiCache } from '../cache/api-cache';
import { LeaderboardResponse } from '../services/leaderboard-service';

class GamificationService {
  static processMeasurement: any;
  static async getUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
    throw new Error('Method not implemented.');
  }

  constructor(private prisma: PrismaClient) { }

  async updateUserStats(userId: string, newStats: Partial<StatsContent>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Initialize default stats
    const defaultStats: Record<StatsMetric, number> = {
      [StatsMetric.TOTAL_MEASUREMENTS]: 0,
      [StatsMetric.RURAL_MEASUREMENTS]: 0,
      [StatsMetric.VERIFIED_SPOTS]: 0,
      [StatsMetric.HELPFUL_ACTIONS]: 0,
      [StatsMetric.CONSECUTIVE_DAYS]: 0,
      [StatsMetric.QUALITY_SCORE]: 0,
      [StatsMetric.ACCURACY_RATE]: 0,
      [StatsMetric.UNIQUE_LOCATIONS]: 0,
      [StatsMetric.TOTAL_DISTANCE]: 0,
      [StatsMetric.CONTRIBUTION_SCORE]: 0
    };

    // Parse existing stats if they exist
    const existingStats = userProgress.stats?.stats
      ? (StatsContentSchema.parse(userProgress.stats.stats) as Record<StatsMetric, number>)
      : defaultStats;

    // Merge with new stats and validate
    const mergedStats = StatsContentSchema.parse({
      ...existingStats,
      ...Object.entries(newStats).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {} as Record<StatsMetric, number>)
    }) as Prisma.JsonValue;

    // Update or create user stats
    await this.prisma.userStats.upsert({
      where: { userProgressId: userProgress.id },
      create: {
        userProgressId: userProgress.id,
        stats: mergedStats
      },
      update: {
        stats: mergedStats
      }
    });

    // Check achievements
    const achievements = await this.checkAchievements(userId, existingStats);

    // Update achievements
    for (const achievement of achievements) {
      const validatedAchievement = validateAchievement(achievement);
      const requirements = validatedAchievement.requirements as Requirement[];

      await this.prisma.userAchievement.upsert({
        where: {
          userProgressId_achievementId: {
            userProgressId: userProgress.id,
            achievementId: validatedAchievement.id
          }
        },
        create: {
          userProgressId: userProgress.id,
          achievementId: validatedAchievement.id,
          progress: calculateProgress(requirements, existingStats),
          completed: false
        },
        update: {
          progress: calculateProgress(requirements, existingStats)
        }
      });
    }

    return userProgress;
  }

  private async checkAchievements(userId: string, stats: Record<StatsMetric, number>): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany({
      where: {
        userAchievements: {
          none: {
            userProgress: {
              userId
            },
            completed: true
          }
        }
      }
    });

    return achievements.filter(achievement => {
      const requirements = achievement.requirements as Requirement[];
      return checkRequirementMet(requirements, stats);
    });
  }

  async getLeaderboard(timeframe: string = 'all'): Promise<ValidatedLeaderboardEntry[]> {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        timeframe
      },
      orderBy: {
        points: 'desc'
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return entries.map(entry => LeaderboardEntrySchema.parse({
      ...entry,
      userName: entry.user.name,
      userImage: entry.user.image
    }));
  }

  async updateLeaderboardEntry(userId: string, data: { points: number; timeframe: string }): Promise<ValidatedLeaderboardEntry> {
    const entry = await this.prisma.leaderboardEntry.upsert({
      where: {
        userId_timeframe: {
          userId,
          timeframe: data.timeframe
        }
      },
      create: {
        userId,
        points: data.points,
        rank: await this.calculateRank(data.points, data.timeframe),
        timeframe: data.timeframe
      },
      update: {
        points: data.points,
        rank: await this.calculateRank(data.points, data.timeframe)
      }
    });

    // Validate the entry using the schema
    return LeaderboardEntrySchema.parse(entry);
  }

  private async calculateRank(points: number, timeframe: string): Promise<number> {
    const higherScores = await this.prisma.leaderboardEntry.count({
      where: {
        timeframe,
        points: { gt: points }
      }
    });
    return higherScores + 1;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: {
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const achievements = await this.prisma.achievement.findMany();
    return achievements.map(achievement => {
      const userAchievement = userProgress.achievements.find(
        ua => ua.achievementId === achievement.id
      );

      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        completed: userAchievement?.completed || false,
        unlockedAt: userAchievement?.unlockedAt || null
      };
    });
  }

  async getCachedLeaderboard(timeframe: string = 'all'): Promise<ValidatedLeaderboardEntry[]> {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { timeframe },
      orderBy: { points: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return entries.map(entry => LeaderboardEntrySchema.parse({
      ...entry,
      userName: entry.user.name,
      userImage: entry.user.image,
    }));
  }

  async getCachedUserProgress(userId: string): Promise<ValidatedUserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: {
        stats: true,
        achievements: {
          include: {
            achievement: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    return UserProgressSchema.parse({
      ...userProgress,
      achievements: userProgress.achievements.map(ua => ({
        ...ua.achievement,
        progress: ua.progress,
        completed: ua.completed,
        unlockedAt: ua.unlockedAt
      }))
    });
  }
}

export async function getCachedUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
  const cacheKey = `user-progress:${userId}`;
  return await apiCache.fetch<ValidatedUserProgress | null>(
    cacheKey,
    async () => {
      return await GamificationService.getUserProgress(userId);
    },
    300 // 5 minutes TTL
  );
}

export async function getCachedLeaderboard(timeframe: string = 'allTime', page: number = 1, pageSize: number = 10): Promise<LeaderboardResponse> {
  const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}`;
  return await apiCache.fetch<LeaderboardResponse>(
    cacheKey,
    async () => {
      return await GamificationService.getLeaderboard(timeframe, page, pageSize);
    },
    300 // 5 minutes TTL
  );
}

// Export the class
export { GamificationService };

// Export a singleton instance
const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);
export { gamificationService };
