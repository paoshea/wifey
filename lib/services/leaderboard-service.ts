import { PrismaClient, Prisma, User, UserProgress, UserStreak } from '@prisma/client';
import { apiCache } from './api-cache';
import { createApiError } from '../api/error-handler';

const prisma = new PrismaClient();

export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';

export interface LeaderboardUser {
  userId: string;
  username: string;
  points: number;
  contributions: number;
  badges: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  image?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  points: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  };
  contributions: number;
  badges: number;
  image?: string;
}

export interface LeaderboardStats {
  totalUsers: number;
  totalContributions: number;
  topContributor: string;
  mostBadges: string;
  longestStreak: number;
  highestLevel: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  stats?: LeaderboardStats;
}

interface MeasurementDateFilter {
  createdAt?: {
    gte?: Date;
    lt?: Date;
  };
}

export class LeaderboardService {
  private static instance: LeaderboardService;
  private readonly CACHE_TTL = 300;
  private readonly MAX_PAGE_SIZE = 100;

  private constructor() { }

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

    const actualPageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);
    const skip = (page - 1) * actualPageSize;
    const dateFilter = this.getDateFilter(timeframe);

    return await apiCache.wrap(
      `leaderboard:${timeframe}:${page}:${actualPageSize}:${includeStats}`,
      async () => {
        const [total, users] = await prisma.$transaction([
          prisma.userProgress.count({
            where: {
              user: {
                measurements: {
                  some: dateFilter
                }
              }
            }
          }),
          prisma.userProgress.findMany({
            where: {
              user: {
                measurements: {
                  some: dateFilter
                }
              }
            },
            include: {
              user: true,
              userStreak: true,
              userBadges: true
            },
            orderBy: {
              totalPoints: 'desc'
            },
            skip,
            take: actualPageSize
          })
        ]);

        const entries: LeaderboardEntry[] = users.map((progress, index) => ({
          rank: skip + index + 1,
          userId: progress.userId,
          username: progress.user.name ?? progress.user.email.split('@')[0],
          points: progress.totalPoints,
          level: progress.level,
          streak: {
            current: progress.userStreak?.currentStreak ?? 0,
            longest: progress.userStreak?.longestStreak ?? 0
          },
          contributions: progress.stats?.totalMeasurements ?? 0,
          badges: progress.userBadges?.length ?? 0,
          image: progress.user.image
        }));

        const response: LeaderboardResponse = {
          entries,
          pagination: {
            total,
            page,
            pageSize: actualPageSize,
            hasMore: skip + entries.length < total
          }
        };

        if (includeStats) {
          response.stats = await this.getLeaderboardStats(prisma, dateFilter);
        }

        return response;
      },
      { maxAge: this.CACHE_TTL }
    );
  }

  private getDateFilter(timeframe: TimeFrame): MeasurementDateFilter {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (timeframe) {
      case 'daily':
        return {
          createdAt: {
            gte: now
          }
        };
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return {
          createdAt: {
            gte: weekStart
          }
        };
      case 'monthly':
        return {
          createdAt: {
            gte: new Date(now.setMonth(now.getMonth() - 1))
          }
        };
      default:
        return {
          createdAt: {
            gte: new Date(0)
          }
        };
    }
  }

  async getUserRankContext(
    userId: string,
    timeframe: TimeFrame = 'allTime',
    context = 5
  ): Promise<{
    userRank: number;
    surroundingEntries: LeaderboardEntry[];
  }> {
    if (!userId) throw createApiError(400, 'User ID is required');

    const cacheKey = `user_rank_${userId}_${timeframe}_${context}`;

    return apiCache.fetch(
      cacheKey,
      async () => {
        const dateFilter: MeasurementDateFilter = this.getDateFilter(timeframe);

        const userProgress = await prisma.userProgress.findUnique({
          where: { userId },
          select: { totalPoints: true }
        });

        if (!userProgress) {
          throw createApiError(404, 'User progress not found');
        }

        const userRank = await prisma.userProgress.count({
          where: {
            totalPoints: {
              gt: userProgress.totalPoints
            },
            user: {
              measurements: {
                some: dateFilter
              }
            }
          }
        }) + 1;

        const page = Math.max(1, Math.ceil(userRank / 10));
        const surroundingEntries = await this.getLeaderboard(
          timeframe,
          page,
          context * 2 + 1
        );

        return {
          userRank,
          surroundingEntries: surroundingEntries.entries
        };
      },
      {
        maxAge: this.CACHE_TTL,
        priority: 'medium'
      }
    );
  }

  private async getLeaderboardStats(
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">,
    dateFilter: MeasurementDateFilter
  ): Promise<LeaderboardStats> {
    return await apiCache.wrap(
      `leaderboard-stats:${JSON.stringify(dateFilter)}`,
      async () => {
        const [
          { _count: totalUsers },
          { _sum: { totalMeasurements: totalContributions = 0 } = {} },
          topContributor,
          mostBadgesUser,
          longestStreak,
          highestLevel
        ] = await Promise.all([
          tx.userProgress.count(),
          tx.userStats.aggregate({
            _sum: {
              totalMeasurements: true
            }
          }),
          tx.userProgress.findFirst({
            where: {
              user: {
                measurements: {
                  some: dateFilter
                }
              }
            },
            orderBy: {
              totalPoints: 'desc'
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }),
          tx.userProgress.findFirst({
            orderBy: {
              userBadges: {
                _count: 'desc'
              }
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }),
          tx.userStreak.findFirst({
            orderBy: {
              currentStreak: 'desc'
            }
          }),
          tx.userProgress.findFirst({
            orderBy: {
              level: 'desc'
            }
          })
        ]);

        return {
          totalUsers,
          totalContributions: totalContributions ?? 0,
          topContributor: topContributor?.user.name ?? topContributor?.user.email.split('@')[0] ?? 'N/A',
          mostBadges: mostBadgesUser?.user.name ?? mostBadgesUser?.user.email.split('@')[0] ?? 'N/A',
          longestStreak: longestStreak?.currentStreak ?? 0,
          highestLevel: highestLevel?.level ?? 1
        };
      },
      { maxAge: this.CACHE_TTL * 2 }
    );
  }
}

export const leaderboardService = LeaderboardService.getInstance();
