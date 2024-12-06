import { PrismaClient, Prisma } from '@prisma/client';
import {
  type StatsContent,
  type LeaderboardResponse,
  TimeFrame,
  jsonToStats
} from '../gamification/types';
import { calculateLevel } from '../gamification/validation';
import { GamificationError } from '../gamification/errors';
import { prisma } from '../prisma';
import * as memoryCache from 'memory-cache';
import { type Achievement } from './db/achievement-adapter';
import { achievementService } from './db/achievement-service';
import { leaderboardService } from './db/leaderboard-service';

interface CacheOptions {
  ttl?: number;
}

class GamificationCache {
  private cache: memoryCache.CacheClass<string, any>;
  private defaultTTL: number = 300; // 5 minutes default TTL

  constructor() {
    this.cache = new memoryCache.Cache();
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cachedValue = this.cache.get(key);
    if (cachedValue !== null) {
      return cachedValue as T;
    }

    const value = await fn();
    this.cache.put(key, value, options.ttl || this.defaultTTL * 1000);
    return value;
  }

  del(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Helper types and constants
const defaultStats: StatsContent = {
  points: 0,
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

export interface UserProgressData {
  points: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: {
    current: number;
    longest: number;
  };
  stats: StatsContent;
  achievements?: Achievement[];
}

export class GamificationService {
  private apiCache: GamificationCache;
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
    this.apiCache = new GamificationCache();
  }

  async getTotalUsers(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const cacheKey = `totalUsers:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const dateFilter = this.getDateFilter(timeframe);
      return this.prisma.user.count();
    });
  }

  async getTotalContributions(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const cacheKey = `totalContributions:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const dateFilter = this.getDateFilter(timeframe);
      return this.prisma.coverageReport.count();
    });
  }

  private mapUserStatsToStatsContent(userStats: Prisma.UserStatsGetPayload<{}>): StatsContent {
    try {
      if (typeof userStats.stats !== 'object' || userStats.stats === null) {
        throw new Error('Invalid stats format');
      }

      const statsData = jsonToStats(userStats.stats);
      return {
        ...statsData,
        points: userStats.points
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error parsing user stats:', err);
      return { ...defaultStats, points: userStats.points };
    }
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return achievementService.getAchievements(userId);
  }

  async getUserProgress(userId: string): Promise<UserProgressData> {
    try {
      const [stats, achievements] = await Promise.all([
        this.prisma.userStats.findUnique({
          where: { userId }
        }),
        this.getAchievements(userId)
      ]);

      if (!stats) {
        return {
          points: 0,
          level: 0,
          currentXP: 0,
          nextLevelXP: 1000,
          streak: {
            current: 0,
            longest: 0
          },
          stats: defaultStats,
          achievements: []
        };
      }

      const mappedStats = this.mapUserStatsToStatsContent(stats);
      const points = mappedStats.points;
      const level = calculateLevel(points);
      const currentXP = points % 1000;
      const nextLevelXP = 1000;

      return {
        points,
        level,
        currentXP,
        nextLevelXP,
        streak: {
          current: mappedStats.consecutiveDays,
          longest: mappedStats.consecutiveDays
        },
        stats: mappedStats,
        achievements
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting user progress:', err);
      throw new GamificationError('Failed to fetch user progress', 'USER_PROGRESS_ERROR');
    }
  }

  async getUserPoints(userId: string): Promise<number | null> {
    try {
      const stats = await this.prisma.userStats.findUnique({
        where: { userId },
        select: { points: true }
      });
      return stats?.points ?? null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting user points:', err);
      throw new GamificationError('Failed to fetch user points', 'USER_POINTS_ERROR');
    }
  }

  async getLeaderboard(
    timeframe: TimeFrame = TimeFrame.ALL_TIME,
    page = 1,
    pageSize = 10
  ): Promise<LeaderboardResponse> {
    return leaderboardService.getLeaderboard(timeframe, page, pageSize);
  }

  async getUserRank(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
    const cacheKey = `userRank:${userId}:${timeframe}`;
    return this.apiCache.wrap(cacheKey, () => leaderboardService.getUserRank(userId, timeframe));
  }

  async getLeaderboardPosition(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME) {
    const cacheKey = `leaderboardPosition:${userId}:${timeframe}`;
    return this.apiCache.wrap(cacheKey, () => leaderboardService.getLeaderboardPosition(userId, timeframe));
  }

  private getDateFilter(timeframe: TimeFrame): { gte: Date } {
    const now = new Date();
    switch (timeframe) {
      case TimeFrame.DAILY:
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
      case TimeFrame.WEEKLY:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return { gte: weekStart };
      case TimeFrame.MONTHLY:
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
      case TimeFrame.ALL_TIME:
      default:
        return {
          gte: new Date(0) // Unix epoch
        };
    }
  }
}

export const gamificationService = new GamificationService();
