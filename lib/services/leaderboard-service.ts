// lib/services/leaderboard-service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { Cache } from 'memory-cache';
import { prisma } from '@/lib/prisma';
import { 
  TimeFrame, 
  LeaderboardEntry, 
  LeaderboardResponse,
  StatsContent 
} from '../gamification/types';

// Type definitions
interface LeaderboardOptions {
  timeframe?: TimeFrame;
  page?: number;
  pageSize?: number;
}

interface UserWithStats {
  id: string;
  name: string | null;
  userStats?: {
    points: number;
    statsData: StatsContent;
  };
  streakHistory?: Array<{
    current: number;
    longest: number;
  }>;
}

type LeaderboardOrderBy = {
  userStats?: {
    points?: Prisma.SortOrder;
  };
};

// Type guards
function isValidStats(stats: any): stats is StatsContent {
  return stats && 
    typeof stats.totalMeasurements === 'number' &&
    typeof stats.contributionScore === 'number' &&
    typeof stats.qualityScore === 'number';
}

export class LeaderboardService {
  private cache: Cache<string, any>;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaClient = prisma) {
    this.cache = new Cache();
  }

  async getLeaderboard(
    timeframe: TimeFrame = TimeFrame.ALL_TIME,
    page: number = 1,
    limit: number = 10
  ): Promise<LeaderboardResponse> {
    const cacheKey = `leaderboard:${timeframe}:${page}:${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const dateFilter = this.getDateFilter(timeframe);
    const skip = (page - 1) * limit;

    const orderBy: LeaderboardOrderBy = {
      userStats: {
        points: Prisma.SortOrder.desc
      }
    };

    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        skip,
        where: {
          measurements: {
            some: {
              createdAt: dateFilter
            }
          }
        },
        orderBy,
        select: {
          id: true,
          name: true,
          userStats: {
            select: {
              points: true,
              statsData: true
            }
          }
        }
      }),
      this.prisma.user.count({
        where: {
          measurements: {
            some: {
              createdAt: dateFilter
            }
          }
        }
      })
    ]);

    const entries: LeaderboardEntry[] = users.map((user, index) => {
      const statsData = user.userStats?.statsData;
      const validStats = isValidStats(statsData) ? statsData : {
        totalMeasurements: 0,
        contributionScore: 0,
        qualityScore: 0
      };

      return {
        userId: user.id,
        username: user.name || 'Anonymous',
        points: user.userStats?.points || 0,
        rank: skip + index + 1,
        stats: {
          totalMeasurements: validStats.totalMeasurements,
          contributionScore: validStats.contributionScore,
          qualityScore: validStats.qualityScore
        }
      };
    });

    const response: LeaderboardResponse = {
      timeframe,
      entries,
      totalUsers,
      userRank: undefined // Will be set by the API route if user is authenticated
    };

    this.cache.put(cacheKey, response, LeaderboardService.CACHE_TTL);
    return response;
  }

  private getDateFilter(timeframe: TimeFrame): { gte: Date } {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeframe) {
      case TimeFrame.DAILY:
        return { gte: startOfDay };
      
      case TimeFrame.WEEKLY:
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return { gte: startOfWeek };
      
      case TimeFrame.MONTHLY:
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { gte: startOfMonth };
      
      case TimeFrame.ALL_TIME:
      default:
        return { gte: new Date(0) }; // Beginning of time
    }
  }

  async getUserRank(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
    const cacheKey = `userRank:${userId}:${timeframe}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    const dateFilter = this.getDateFilter(timeframe);
    const userPoints = await this.getUserPoints(userId);

    if (userPoints === null) {
      return null;
    }

    const userRank = await this.prisma.user.count({
      where: {
        measurements: {
          some: {
            createdAt: dateFilter
          }
        },
        userStats: {
          points: {
            gt: userPoints
          }
        }
      }
    });

    this.cache.put(cacheKey, userRank + 1, LeaderboardService.CACHE_TTL);
    return userRank + 1;
  }

  private async getUserPoints(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userStats: {
          select: {
            points: true
          }
        }
      }
    });

    return user?.userStats?.points ?? null;
  }

  async getUserStreaks(userId: string): Promise<{ current: number; longest: number }> {
    const streaks = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakHistory: {
          orderBy: {
            updatedAt: Prisma.SortOrder.desc
          },
          take: 1,
          select: {
            current: true,
            longest: true
          }
        }
      }
    });

    const latestStreak = streaks?.streakHistory[0];
    return {
      current: latestStreak?.current ?? 0,
      longest: latestStreak?.longest ?? 0
    };
  }
}

export const leaderboardService = new LeaderboardService();
