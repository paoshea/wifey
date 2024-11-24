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
}

export interface LeaderboardEntry extends Omit<LeaderboardUser, 'currentStreak' | 'longestStreak'> {
  rank: number;
  streak: {
    current: number;
    longest: number;
  };
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

type MeasurementDateFilter = Prisma.MeasurementWhereInput;

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

    const skip = (Number(page) - 1) * pageSize;
    const cacheKey = `leaderboard_${timeframe}_${page}_${pageSize}_${includeStats}`;
    
    return apiCache.fetch(
      cacheKey,
      async () => {
        const result = await prisma.$transaction(async (tx) => {
          const dateFilter = this.getDateFilter(timeframe);
          
          const totalCountKey = `leaderboard_count_${timeframe}`;
          const totalCount = await apiCache.fetch<number>(
            totalCountKey,
            async () => await tx.userProgress.count({
              where: {
                user: {
                  measurements: {
                    some: dateFilter
                  }
                }
              }
            }),
            { priority: 'high', maxAge: 600 }
          );

          const users = await tx.userProgress.findMany({
            where: {
              user: {
                measurements: {
                  some: dateFilter
                }
              }
            },
            include: {
              user: true,
              streaks: true
            },
            orderBy: {
              totalPoints: 'desc'
            },
            skip,
            take: pageSize
          }) as (UserProgress & { user: User; streaks: UserStreak | null })[];

          const entries: LeaderboardEntry[] = users.map((user, index) => ({
            rank: skip + index + 1,
            userId: user.userId,
            username: user.user.name ?? user.user.email.split('@')[0],
            points: user.totalPoints,
            level: user.level,
            streak: user.streaks 
              ? { current: user.streaks.currentStreak, longest: user.streaks.currentStreak } 
              : { current: 0, longest: 0 },
            contributions: 0,  // TODO: Calculate from measurements
            badges: 0         // TODO: Calculate from achievements
          }));

          let stats: LeaderboardStats | undefined;
          if (includeStats) {
            stats = await this.getLeaderboardStats(tx, dateFilter);
          }

          return {
            entries,
            pagination: {
              total: totalCount,
              page,
              pageSize,
              hasMore: skip + entries.length < totalCount
            },
            stats
          };
        });

        return result;
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
          timestamp: {
            gte: now
          }
        };
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return {
          timestamp: {
            gte: weekStart
          }
        };
      case 'monthly':
        return {
          timestamp: {
            gte: new Date(now.setMonth(now.getMonth() - 1))
          }
        };
      default:
        return {
          timestamp: {
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
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    dateFilter: MeasurementDateFilter
  ): Promise<LeaderboardStats> {
    const statsKey = `leaderboard_stats_${JSON.stringify(dateFilter)}`;
    
    return apiCache.fetch(
      statsKey,
      async () => {
        const [
          totalUsers,
          totalContributions,
          topContributor,
          mostBadges,
          longestStreak,
          highestLevel
        ] = await Promise.all([
          tx.userProgress.count({
            where: {
              user: {
                measurements: { some: dateFilter }
              }
            }
          }),
          tx.measurement.count({ where: dateFilter }),
          tx.userProgress.findFirst({
            where: {
              user: {
                measurements: { some: dateFilter }
              }
            },
            orderBy: { totalPoints: 'desc' },
            select: {
              user: { select: { name: true, email: true } }
            }
          }),
          tx.userProgress.findFirst({
            orderBy: {
              badges: { _count: 'desc' }
            },
            select: {
              user: { select: { name: true, email: true } }
            }
          }),
          tx.userStreak.findFirst({
            orderBy: { currentStreak: 'desc' },
            select: { currentStreak: true }
          }),
          tx.userProgress.findFirst({
            orderBy: { level: 'desc' },
            select: { level: true }
          })
        ]);

        return {
          totalUsers,
          totalContributions,
          topContributor: topContributor?.user.name ?? topContributor?.user.email?.split('@')[0] ?? 'N/A',
          mostBadges: mostBadges?.user.name ?? mostBadges?.user.email?.split('@')[0] ?? 'N/A',
          longestStreak: longestStreak?.currentStreak ?? 0,
          highestLevel: highestLevel?.level ?? 1
        };
      },
      {
        maxAge: this.CACHE_TTL * 2,
        priority: 'high'
      }
    );
  }
}

export const leaderboardService = LeaderboardService.getInstance();
