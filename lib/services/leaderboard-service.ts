// lib/services/leaderboard-service.ts

import { PrismaClient, Prisma, User, UserStats, UserStreak, Measurement, WifiSpot, CoverageReport } from '@prisma/client';
import { apiCache } from './api-cache';
import { createApiError } from '../api/error-handler';
import { 
  TimeFrame, 
  LeaderboardEntry, 
  LeaderboardStats, 
  LeaderboardResponse,
  StatsContent,
  jsonToStats
} from '../gamification/types';
import { calculateLevel } from '../gamification/validation';

export type { TimeFrame, LeaderboardEntry, LeaderboardStats, LeaderboardResponse };

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    achievements: true;
    stats: true;
    streaks: true;
    measurements: {
      include: {
        wifiSpots: true;
        coverageReports: true;
      };
    };
  };
}>;

type UserSelect = {
  id: true;
  name: true;
  email: true;
  image: true;
  points: true;
  level: true;
  userStreak: {
    select: {
      currentStreak: true;
      longestStreak: true;
    };
  };
  stats: {
    select: {
      stats: true;
    };
  };
  achievements: {
    select: {
      id: true;
      unlockedAt: true;
    };
  };
  measurements: {
    select: {
      id: true;
      timestamp: true;
    };
  };
};

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

        const [total, users] = await Promise.all([
          prisma.user.count({
            where: {
              measurements: {
                some: {
                  timestamp: dateFilter.timestamp
                }
              }
            }
          }),
          prisma.user.findMany({
            where: {
              measurements: {
                some: {
                  timestamp: dateFilter.timestamp
                }
              }
            },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              points: true,
              level: true,
              userStreak: {
                select: {
                  currentStreak: true,
                  longestStreak: true
                }
              },
              stats: {
                select: {
                  stats: true
                }
              },
              achievements: {
                select: {
                  id: true,
                  unlockedAt: true
                }
              },
              measurements: {
                select: {
                  id: true,
                  timestamp: true
                }
              }
            } as UserSelect,
            orderBy: {
              points: 'desc'
            },
            skip,
            take: actualPageSize
          })
        ]);

        const entries: LeaderboardEntry[] = users.map((user: UserWithRelations, index) => {
          const username = user.name ?? user.email?.split('@')[0] ?? 'Anonymous';
          const stats = user.stats?.stats 
            ? (user.stats.stats as Prisma.JsonValue as StatsContent)
            : {} as StatsContent;
          const streak = user.userStreak ?? { currentStreak: 0, longestStreak: 0 };
          
          const entry: LeaderboardEntry = {
            rank: skip + index + 1,
            userId: user.id,
            username,
            points: user.points ?? 0,
            level: calculateLevel(user.points ?? 0),
            streak: {
              current: streak.currentStreak,
              longest: streak.longestStreak
            },
            stats: includeStats ? stats : undefined
          };

          return entry;
        });

        const response: LeaderboardResponse = {
          timeframe,
          page,
          pageSize: actualPageSize,
          total,
          entries
        };

        if (includeStats) {
          response.stats = await this.getLeaderboardStats(prisma, dateFilter);
        }

        return response;
      },
      { maxAge: this.CACHE_TTL }
    );
  }

  async getUserStats(userId: string): Promise<LeaderboardStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        stats: true,
        streaks: true,
        measurements: {
          include: {
            wifiSpots: true,
            coverageReports: true
          }
        }
      }
    }) as UserWithRelations | null;

    if (!user) {
      throw createApiError(404, 'User not found');
    }

    const stats = user.stats?.stats 
      ? (user.stats.stats as Prisma.JsonValue as StatsContent)
      : {} as StatsContent;

    const streak = user.userStreak ?? { currentStreak: 0, longestStreak: 0 };

    return {
      userId: user.id,
      username: user.name ?? user.email?.split('@')[0] ?? 'Anonymous',
      points: user.points ?? 0,
      level: calculateLevel(user.points ?? 0),
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak
      },
      stats,
      achievements: user.achievements.map(a => ({
        id: a.id,
        unlockedAt: a.unlockedAt
      })),
      measurements: {
        total: user.measurements.length,
        wifi: user.measurements.filter(m => m.wifiSpots).length,
        coverage: user.measurements.filter(m => m.coverageReports).length
      }
    };
  }

  async getUserRankWithContext(
    userId: string,
    timeframe: TimeFrame = 'allTime',
    context = 2
  ): Promise<LeaderboardResponse> {
    const dateFilter = this.getDateFilter(timeframe);

    const userRank = await prisma.user.count({
      where: {
        points: {
          gt: (await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
          }))?.points ?? 0
        },
        measurements: {
          some: {
            timestamp: dateFilter.timestamp
          }
        }
      }
    });

    const users = await prisma.user.findMany({
      where: {
        measurements: {
          some: {
            timestamp: dateFilter.timestamp
          }
        }
      },
      include: {
        achievements: true,
        stats: true,
        streaks: true,
        measurements: {
          include: {
            wifiSpots: true,
            coverageReports: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      },
      take: context * 2 + 1,
      skip: Math.max(0, userRank - context - 1)
    }) as UserWithRelations[];

    const total = await prisma.user.count({
      where: {
        measurements: {
          some: {
            timestamp: dateFilter.timestamp
          }
        }
      }
    });

    const entries = users.map((user, index) => {
      const username = user.name ?? user.email?.split('@')[0] ?? 'Anonymous';
      const stats = user.stats?.stats 
        ? (user.stats.stats as Prisma.JsonValue as StatsContent)
        : {} as StatsContent;
      const streak = user.userStreak ?? { currentStreak: 0, longestStreak: 0 };

      return {
        rank: userRank + index + 1,
        userId: user.id,
        username,
        points: user.points ?? 0,
        level: calculateLevel(user.points ?? 0),
        streak: {
          current: streak.currentStreak,
          longest: streak.longestStreak
        },
        stats
      };
    });

    return {
      timeframe,
      page: Math.floor(userRank / (context * 2 + 1)) + 1,
      pageSize: context * 2 + 1,
      total,
      entries
    };
  }

  private getDateFilter(timeframe: TimeFrame): { timestamp: { gte: Date } } {
    const now = new Date();
    switch (timeframe) {
      case 'daily':
        now.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() - now.getDay());
        now.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        break;
      case 'allTime':
        return { timestamp: { gte: new Date(0) } };
    }
    return { timestamp: { gte: now } };
  }

  private async getLeaderboardStats(
    tx: PrismaClient,
    dateFilter: { timestamp: { gte: Date } }
  ): Promise<LeaderboardStats> {
    const [totalUsers, totalMeasurements, averagePoints] = await Promise.all([
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
      tx.user.aggregate({
        where: {
          measurements: {
            some: {
              timestamp: dateFilter.timestamp
            }
          }
        },
        _avg: {
          points: true
        }
      })
    ]);

    return {
      totalUsers,
      totalMeasurements,
      averagePoints: Math.round(averagePoints._avg.points ?? 0)
    };
  }
}

export const leaderboardService = LeaderboardService.getInstance();
