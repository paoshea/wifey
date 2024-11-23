import { PrismaClient, User, UserProgress, UserStreak, UserBadge, LeaderboardEntry } from '@prisma/client';
import { apiCache } from './api-cache';
import { createApiError } from '../api/error-handler';

const prisma = new PrismaClient();

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  points: number;
  contributions: number;
  badges: number;
  streak: {
    current: number;
    longest: number;
  };
  level: number;
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

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';

interface DateFilter {
  createdAt?: {
    gte?: Date;
  };
}

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
    const validatedPage = Math.max(1, page);
    const validatedPageSize = Math.min(Math.max(1, pageSize), this.MAX_PAGE_SIZE);
    const offset = (validatedPage - 1) * validatedPageSize;

    const cacheKey = `leaderboard_${timeframe}_${validatedPage}_${validatedPageSize}_${includeStats}`;
    
    return apiCache.fetch(
      cacheKey,
      async () => {
        const result = await prisma.$transaction(async (tx) => {
          const dateFilter = this.getDateFilter(timeframe);
          
          const totalCountKey = `leaderboard_count_${timeframe}`;
          const totalCount = await apiCache.fetch(
            totalCountKey,
            () => tx.userProgress.count({
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
            select: {
              userId: true,
              totalPoints: true,
              level: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              },
              streaks: {
                select: {
                  currentStreak: true,
                  longestStreak: true
                }
              },
              badges: {
                select: {
                  id: true,
                  badgeType: true,
                  level: true
                }
              },
              stats: {
                select: {
                  totalMeasurements: true,
                  qualityScore: true
                }
              }
            },
            orderBy: [
              { totalPoints: 'desc' },
              { level: 'desc' }
            ],
            take: validatedPageSize,
            skip: offset
          });

          const entries = users.map((user, index) => ({
            userId: user.userId,
            username: user.user.name ?? user.user.email.split('@')[0],
            avatar: undefined, // Add avatar support if needed
            rank: offset + index + 1,
            points: user.totalPoints,
            contributions: user.stats?.totalMeasurements ?? 0,
            badges: user.badges.length,
            streak: {
              current: user.streaks?.currentStreak ?? 0,
              longest: user.streaks?.longestStreak ?? 0
            },
            level: user.level
          }));

          const stats = includeStats ? await this.getLeaderboardStats(tx, dateFilter) : undefined;

          return {
            entries,
            pagination: {
              total: totalCount,
              page: validatedPage,
              pageSize: validatedPageSize,
              hasMore: offset + entries.length < totalCount
            },
            stats
          };
        });

        if (result.pagination.hasMore) {
          const nextPageKey = `leaderboard_${timeframe}_${validatedPage + 1}_${validatedPageSize}_${includeStats}`;
          apiCache.prefetch(nextPageKey);
        }

        return result;
      },
      {
        maxAge: this.CACHE_TTL,
        priority: validatedPage === 1 ? 'high' : 'medium'
      }
    );
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
        const dateFilter = this.getDateFilter(timeframe);
        
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
    tx: PrismaClient,
    dateFilter: DateFilter
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
            orderBy: { longestStreak: 'desc' },
            select: { longestStreak: true }
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
          longestStreak: longestStreak?.longestStreak ?? 0,
          highestLevel: highestLevel?.level ?? 1
        };
      },
      {
        maxAge: this.CACHE_TTL * 2,
        priority: 'high'
      }
    );
  }

  private getDateFilter(timeframe: TimeFrame): DateFilter {
    const now = new Date();
    
    switch (timeframe) {
      case 'daily':
        return {
          createdAt: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        };
      case 'weekly':
        return {
          createdAt: {
            gte: new Date(now.setDate(now.getDate() - 7))
          }
        };
      case 'monthly':
        return {
          createdAt: {
            gte: new Date(now.setMonth(now.getMonth() - 1))
          }
        };
      default:
        return {};
    }
  }
}

export const leaderboardService = LeaderboardService.getInstance();
