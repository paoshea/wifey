// lib/services/leaderboard-service.ts

import { PrismaClient, type Prisma } from '@prisma/client';
import { apiCache } from './api-cache';
import { createApiError } from '../api/error-handler';
import type { 
  TimeFrame, 
  LeaderboardEntry, 
  LeaderboardStats, 
  LeaderboardResponse,
  StatsContent
} from '../gamification/types';
import { calculateLevel } from '../gamification/validation';
import { prisma } from '@/lib/prisma';

// Type for user data with stats
type UserWithStats = Prisma.UserGetPayload<{
  include: {
    stats: true;
    streaks: true;
  };
}>;

// Type for user data with all relations
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    stats: true;
    streaks: true;
    achievements: {
      select: {
        id: true;
        unlockedAt: true;
      };
    };
  };
}>;

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

export class LeaderboardService {
  private static instance: LeaderboardService;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MAX_PAGE_SIZE = 100;

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  async getLeaderboard(
    timeframe: TimeFrame = 'allTime',
    page = 1,
    pageSize = 10,
    includeStats = false
  ): Promise<LeaderboardResponse> {
    if (pageSize > this.MAX_PAGE_SIZE) {
      throw createApiError(400, 'Page size exceeds maximum allowed');
    }

    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}:${includeStats}`;
    const skip = (page - 1) * pageSize;
    const actualPageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);

    return apiCache.fetch(
      cacheKey,
      async () => {
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            take: actualPageSize,
            skip,
            include: {
              stats: true,
              streaks: true,
              achievements: {
                select: {
                  id: true,
                  unlockedAt: true
                }
              }
            },
            orderBy: {
              stats: {
                points: 'desc'
              }
            }
          }),
          prisma.user.count()
        ]);

        const entries: LeaderboardEntry[] = users.map((user, index) => {
          const stats = user.stats?.stats as StatsContent || defaultStats;
          
          return {
            position: skip + index + 1,
            userId: user.id,
            username: user.name || 'Anonymous',
            points: user.stats?.points || 0,
            level: calculateLevel(user.stats?.points || 0),
            streak: {
              current: user.streaks?.[0]?.current || 0,
              longest: user.streaks?.[0]?.longest || 0
            },
            stats: includeStats ? stats : undefined,
            achievements: user.achievements?.length || 0
          };
        });

        return {
          timeframe,
          page,
          pageSize: actualPageSize,
          total,
          entries
        };
      },
      { maxAge: this.CACHE_TTL }
    );
  }

  async getUserPosition(userId: string): Promise<{ position: number; total: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true
      }
    });

    if (!user) {
      throw createApiError(404, 'User not found');
    }

    const userPoints = user.stats?.points || 0;

    const higherRankedUsers = await prisma.user.count({
      where: {
        stats: {
          points: {
            gt: userPoints
          }
        }
      }
    });

    const total = await prisma.user.count();
    const position = higherRankedUsers + 1;

    return { position, total };
  }

  async getUserStats(userId: string): Promise<LeaderboardStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
        streaks: true,
        achievements: {
          select: {
            id: true,
            unlockedAt: true
          }
        }
      }
    });

    if (!user) {
      throw createApiError(404, 'User not found');
    }

    const stats = user.stats?.stats as StatsContent || defaultStats;
    const { position, total } = await this.getUserPosition(userId);

    return {
      userId: user.id,
      position,
      total,
      points: user.stats?.points || 0,
      level: calculateLevel(user.stats?.points || 0),
      streak: {
        current: user.streaks?.[0]?.current || 0,
        longest: user.streaks?.[0]?.longest || 0
      },
      stats,
      achievements: user.achievements?.length || 0
    };
  }

  private getDateFilter(timeframe: TimeFrame): { timestamp: { gte: Date } } {
    const now = new Date();
    let date = new Date();

    switch (timeframe) {
      case 'daily':
        date.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        date.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default: // allTime
        date = new Date(0); // Beginning of time
    }

    return {
      timestamp: {
        gte: date
      }
    };
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance();

// Export types
export type { TimeFrame, LeaderboardEntry, LeaderboardStats, LeaderboardResponse };
