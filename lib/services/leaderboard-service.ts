// lib/services/leaderboard-service.ts

import { PrismaClient, Prisma, User, UserProgress, UserStreak } from '@prisma/client';
import { apiCache } from './api-cache';
import { createApiError } from '../api/error-handler';
import { TimeFrame, LeaderboardEntry, LeaderboardStats, LeaderboardResponse } from '../gamification/types';

export type { TimeFrame, LeaderboardEntry, LeaderboardStats, LeaderboardResponse } from '../gamification/types';

const prisma = new PrismaClient();

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

    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}:${includeStats}`;
    const skip = (page - 1) * pageSize;
    const actualPageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);

    return apiCache.fetch(
      cacheKey,
      async () => {
        const dateFilter = this.getDateFilter(timeframe);

        const [total, userProgress] = await Promise.all([
          prisma.userProgress.count({
            where: {
              user: {
                measurements: {
                  some: {
                    timestamp: dateFilter.timestamp
                  }
                }
              }
            }
          }),
          prisma.userProgress.findMany({
            where: {
              user: {
                measurements: {
                  some: {
                    timestamp: dateFilter.timestamp
                  }
                }
              }
            },
            select: {
              id: true,
              userId: true,
              totalPoints: true,
              level: true,
              streak: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true
                }
              },
              stats: {
                select: {
                  stats: true
                }
              },
              userBadges: {
                select: {
                  id: true
                }
              }
            },
            orderBy: {
              totalPoints: 'desc'
            },
            skip,
            take: actualPageSize
          })
        ]);

        const entries: LeaderboardEntry[] = userProgress.map((progress, index) => {
          const username = progress.user?.name ?? progress.user?.email?.split('@')[0] ?? 'Anonymous';
          const stats = (progress.stats?.stats as { [key: string]: number }) ?? {};
          const currentStreak = progress.streak ?? 0;

          return {
            id: progress.id,
            rank: skip + index + 1,
            userId: progress.userId,
            username,
            points: progress.totalPoints,
            level: progress.level,
            streak: {
              current: currentStreak,
              longest: currentStreak // Using current streak as longest since we don't track longest separately
            },
            contributions: stats.totalMeasurements ?? 0,
            badges: progress.userBadges?.length ?? 0,
            image: progress.user?.image
          };
        });

        const response: LeaderboardResponse = {
          entries,
          pagination: {
            total,
            page,
            pageSize: actualPageSize,
            hasMore: skip + actualPageSize < total
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

  private getDateFilter(timeframe: TimeFrame): { timestamp?: { gte?: Date; lt?: Date; lte?: Date } } {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeframe) {
      case 'daily':
        return {
          timestamp: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          }
        };
      case 'weekly':
        const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000);
        return {
          timestamp: {
            gte: startOfWeek,
            lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        };
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          timestamp: {
            gte: startOfMonth,
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        };
      case 'allTime':
      default:
        return {
          timestamp: {
            lte: now
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
        const dateFilter: { timestamp?: { gte?: Date; lt?: Date; lte?: Date } } = this.getDateFilter(timeframe);

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
                some: {
                  timestamp: dateFilter.timestamp
                }
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
    dateFilter: { timestamp?: { gte?: Date; lt?: Date; lte?: Date } }
  ): Promise<LeaderboardStats> {
    const cacheKey = `leaderboard-stats:${JSON.stringify(dateFilter)}`;
    return await apiCache.fetch<LeaderboardStats>(
      cacheKey,
      async () => {
        const [
          totalUsers,
          measurements,
          topContributor,
          streakLeader,
          levelLeader
        ] = await Promise.all([
          tx.user.count({
            where: {
              measurements: {
                some: {
                  timestamp: dateFilter.timestamp
                }
              }
            }
          }),
          tx.measurement.count({
            where: {
              timestamp: dateFilter.timestamp
            }
          }),
          tx.user.findFirst({
            where: {
              measurements: {
                some: {
                  timestamp: dateFilter.timestamp
                }
              }
            },
            orderBy: {
              measurements: {
                _count: 'desc'
              }
            },
            select: {
              name: true,
              email: true
            }
          }),
          tx.userProgress.findFirst({
            where: {
              user: {
                measurements: {
                  some: {
                    timestamp: dateFilter.timestamp
                  }
                }
              }
            },
            orderBy: {
              streak: 'desc'
            },
            select: {
              streak: true
            }
          }),
          tx.userProgress.findFirst({
            where: {
              user: {
                measurements: {
                  some: {
                    timestamp: dateFilter.timestamp
                  }
                }
              }
            },
            orderBy: {
              level: 'desc'
            }
          })
        ]);

        return {
          totalUsers,
          totalContributions: measurements,
          topContributor: topContributor?.name ?? topContributor?.email?.split('@')[0] ?? 'Anonymous',
          mostBadges: 'N/A', // TODO: Implement badges count
          longestStreak: streakLeader?.streak ?? 0,
          highestLevel: levelLeader?.level ?? 0
        };
      }
    );
  }
}

export const leaderboardService = LeaderboardService.getInstance();
