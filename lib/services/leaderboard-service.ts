// lib/services/leaderboard-service.ts

import { PrismaClient, User, UserStats, Achievement as PrismaAchievement } from '@prisma/client';
import NodeCache from 'node-cache';
import { prisma } from 'lib/prisma';
import {
  TimeFrame,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type StatsContent
} from '../gamification/types';

// Type definitions
interface LeaderboardOptions {
  timeframe?: TimeFrame;
  page?: number;
  pageSize?: number;
}

interface UserWithRelations extends User {
  stats: (UserStats & {
    stats: string;
  }) | null;
  achievements: Array<{
    id: string;
    title: string;
    icon: string | null;
  }>;
}

export class LeaderboardService {
  private cache: NodeCache;
  private static readonly CACHE_TTL = 5 * 60; // 5 minutes
  private static instance: LeaderboardService;

  private constructor(prismaClient: PrismaClient = prisma) {
    this.cache = new NodeCache({ stdTTL: LeaderboardService.CACHE_TTL });
    this.prisma = prismaClient;
  }

  public static getInstance(prismaClient: PrismaClient = prisma): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService(prismaClient);
    }
    return LeaderboardService.instance;
  }

  private readonly prisma: PrismaClient;

  async getLeaderboard(options: LeaderboardOptions = {}): Promise<LeaderboardResponse> {
    const {
      timeframe = TimeFrame.ALL_TIME,
      page = 1,
      pageSize = 10
    } = options;

    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}`;
    const cached = this.cache.get<LeaderboardResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const dateFilter = this.getDateFilter(timeframe);

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        include: {
          stats: true,
          achievements: {
            where: {
              unlockedAt: { not: null }
            },
            orderBy: {
              unlockedAt: 'desc'
            },
            take: 3,
            select: {
              id: true,
              title: true,
              icon: true
            }
          }
        },
        orderBy: {
          stats: {
            points: 'desc'
          }
        }
      }) as Promise<UserWithRelations[]>,
      this.prisma.user.count()
    ]);

    const entries: LeaderboardEntry[] = users.map((user, index) => {
      const statsContent = user.stats?.stats ? JSON.parse(user.stats.stats as string) as StatsContent : null;

      return {
        id: user.id,
        timeframe,
        points: user.stats?.points || 0,
        rank: skip + index + 1,
        username: user.name || 'Anonymous',
        image: user.image || undefined,
        level: Math.floor(Math.sqrt((user.stats?.points || 0) / 100)) + 1,
        contributions: statsContent?.totalMeasurements || 0,
        badges: user.achievements.length,
        streak: {
          current: statsContent?.consecutiveDays || 0,
          longest: statsContent?.consecutiveDays || 0
        },
        recentAchievements: user.achievements.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon || ''
        })),
        user: {
          id: user.id,
          name: user.name || 'Anonymous',
          rank: skip + index + 1,
          measurements: statsContent?.totalMeasurements || 0,
          lastActive: user.stats?.updatedAt || new Date()
        }
      };
    });

    const response: LeaderboardResponse = {
      timeframe,
      entries,
      totalUsers: totalCount
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  async getUserPosition(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true
      }
    });

    if (!user?.stats) {
      return null;
    }

    const higherRanked = await this.prisma.userStats.count({
      where: {
        points: {
          gt: user.stats.points
        }
      }
    });

    return higherRanked + 1;
  }

  async getTotalUsers(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    return this.prisma.user.count({
      where: {
        stats: {
          isNot: null
        }
      }
    });
  }

  async getTotalContributions(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const stats = await this.prisma.userStats.findMany({
      select: {
        stats: true
      }
    });

    return stats.reduce((total, stat) => {
      try {
        const statsContent = JSON.parse(stat.stats as string) as StatsContent;
        return total + (statsContent.totalMeasurements || 0);
      } catch {
        return total;
      }
    }, 0);
  }

  private getDateFilter(timeframe: TimeFrame) {
    const now = new Date();
    switch (timeframe) {
      case TimeFrame.DAILY:
        return {
          createdAt: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        };
      case TimeFrame.WEEKLY: {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          createdAt: {
            gte: weekStart
          }
        };
      }
      case TimeFrame.MONTHLY: {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          createdAt: {
            gte: monthStart
          }
        };
      }
      case TimeFrame.ALL_TIME:
      default:
        return {};
    }
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance();
