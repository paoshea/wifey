// lib/services/leaderboard-service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { Cache } from 'memory-cache';
import prisma from '@/lib/prisma';
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

  constructor(prismaClient: PrismaClient = prisma) {
    this.cache = new Cache();
    this.prisma = prismaClient;
  }

  private readonly prisma: PrismaClient;

  async getLeaderboard(options: LeaderboardOptions = {}): Promise<LeaderboardResponse> {
    const {
      timeframe = TimeFrame.ALL_TIME,
      page = 1,
      pageSize = 10
    } = options;

    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const dateFilter = this.getDateFilter(timeframe);

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          userStats: {
            some: {
              createdAt: dateFilter
            }
          }
        },
        select: {
          id: true,
          name: true,
          userStats: {
            where: dateFilter,
            select: {
              points: true,
              statsData: true
            },
            orderBy: {
              points: 'desc'
            }
          }
        },
        orderBy: {
          userStats: {
            points: 'desc'
          }
        },
        skip,
        take: pageSize
      }),
      this.prisma.user.count({
        where: {
          userStats: {
            some: {
              createdAt: dateFilter
            }
          }
        }
      })
    ]);

    const entries: LeaderboardEntry[] = users.map((user, index) => ({
      position: skip + index + 1,
      id: user.id,
      name: user.name || 'Anonymous',
      points: user.userStats?.[0]?.points || 0,
      stats: user.userStats?.[0]?.statsData || {}
    }));

    const response: LeaderboardResponse = {
      entries,
      totalUsers: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize)
    };

    this.cache.put(cacheKey, response, LeaderboardService.CACHE_TTL);
    return response;
  }

  async getUserPosition(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
    const dateFilter = this.getDateFilter(timeframe);

    const userWithRank = await this.prisma.user.findFirst({
      where: {
        id: userId,
        userStats: {
          some: {
            createdAt: dateFilter
          }
        }
      },
      select: {
        userStats: {
          where: dateFilter,
          select: {
            points: true
          }
        }
      }
    });

    if (!userWithRank?.userStats?.[0]) {
      return null;
    }

    const position = await this.prisma.userStats.count({
      where: {
        points: {
          gt: userWithRank.userStats[0].points
        },
        createdAt: dateFilter
      }
    });

    return position + 1;
  }

  async getTotalUsers(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const dateFilter = this.getDateFilter(timeframe);
    return this.prisma.user.count({
      where: {
        userStats: {
          some: {
            createdAt: dateFilter
          }
        }
      }
    });
  }

  async getTotalContributions(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const dateFilter = this.getDateFilter(timeframe);
    const result = await this.prisma.userStats.aggregate({
      where: dateFilter,
      _sum: {
        totalMeasurements: true
      }
    });
    return result._sum.totalMeasurements || 0;
  }

  private getDateFilter(timeframe: TimeFrame): Prisma.UserStatsWhereInput {
    const now = new Date();
    switch (timeframe) {
      case TimeFrame.DAILY:
        return {
          createdAt: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        };
      case TimeFrame.WEEKLY:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          createdAt: {
            gte: weekStart
          }
        };
      case TimeFrame.MONTHLY:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          createdAt: {
            gte: monthStart
          }
        };
      case TimeFrame.ALL_TIME:
      default:
        return {};
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
