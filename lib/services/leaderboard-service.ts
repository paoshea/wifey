import { PrismaClient } from '@prisma/client';
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

export class LeaderboardService {
  private static instance: LeaderboardService;
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  // Get global leaderboard
  async getLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime',
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard_${timeframe}_${limit}_${offset}`;

    return apiCache.fetch(cacheKey, async () => {
      let dateFilter = {};
      const now = new Date();

      switch (timeframe) {
        case 'daily':
          dateFilter = {
            gte: new Date(now.setHours(0, 0, 0, 0))
          };
          break;
        case 'weekly':
          dateFilter = {
            gte: new Date(now.setDate(now.getDate() - 7))
          };
          break;
        case 'monthly':
          dateFilter = {
            gte: new Date(now.setMonth(now.getMonth() - 1))
          };
          break;
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          achievements: true,
          contributions: {
            where: {
              createdAt: dateFilter
            },
            select: {
              points: true
            }
          },
          badges: {
            select: {
              id: true
            }
          },
          streak: true
        },
        orderBy: {
          contributions: {
            _count: 'desc'
          }
        },
        take: limit,
        skip: offset
      });

      return users.map((user, index) => ({
        userId: user.id,
        username: user.name || 'Anonymous User',
        avatar: user.image || undefined,
        rank: offset + index + 1,
        points: user.contributions.reduce((sum, c) => sum + c.points, 0),
        contributions: user.contributions.length,
        badges: user.badges.length,
        streak: {
          current: user.streak?.current || 0,
          longest: user.streak?.longest || 0
        },
        level: this.calculateLevel(
          user.contributions.reduce((sum, c) => sum + c.points, 0)
        )
      }));
    }, { maxAge: this.CACHE_TTL });
  }

  // Get user's rank and nearby users
  async getUserRankAndNeighbors(
    userId: string,
    neighborCount: number = 3
  ): Promise<{
    userRank: LeaderboardEntry;
    above: LeaderboardEntry[];
    below: LeaderboardEntry[];
  }> {
    const cacheKey = `user_rank_${userId}_${neighborCount}`;

    return apiCache.fetch(cacheKey, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contributions: true,
          badges: true,
          streak: true
        }
      });

      if (!user) {
        throw createApiError(404, 'User not found');
      }

      const userPoints = user.contributions.reduce((sum, c) => sum + c.points, 0);

      // Get users with more points
      const above = await prisma.user.findMany({
        where: {
          contributions: {
            every: {
              points: {
                gt: userPoints
              }
            }
          }
        },
        take: neighborCount,
        orderBy: {
          contributions: {
            _count: 'asc'
          }
        }
      });

      // Get users with fewer points
      const below = await prisma.user.findMany({
        where: {
          contributions: {
            every: {
              points: {
                lt: userPoints
              }
            }
          }
        },
        take: neighborCount,
        orderBy: {
          contributions: {
            _count: 'desc'
          }
        }
      });

      const userRank = {
        userId: user.id,
        username: user.name || 'Anonymous User',
        avatar: user.image || undefined,
        rank: above.length + 1,
        points: userPoints,
        contributions: user.contributions.length,
        badges: user.badges.length,
        streak: {
          current: user.streak?.current || 0,
          longest: user.streak?.longest || 0
        },
        level: this.calculateLevel(userPoints)
      };

      return {
        userRank,
        above: above.map(this.mapUserToLeaderboardEntry),
        below: below.map(this.mapUserToLeaderboardEntry)
      };
    }, { maxAge: this.CACHE_TTL });
  }

  // Get leaderboard statistics
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const cacheKey = 'leaderboard_stats';

    return apiCache.fetch(cacheKey, async () => {
      const [
        totalUsers,
        totalContributions,
        topContributor,
        badgeLeader,
        streakLeader,
        levelLeader
      ] = await Promise.all([
        prisma.user.count(),
        prisma.contribution.count(),
        prisma.user.findFirst({
          orderBy: {
            contributions: {
              _count: 'desc'
            }
          },
          select: { name: true }
        }),
        prisma.user.findFirst({
          orderBy: {
            badges: {
              _count: 'desc'
            }
          },
          select: { name: true }
        }),
        prisma.streak.findFirst({
          orderBy: {
            longest: 'desc'
          },
          select: { longest: true }
        }),
        prisma.user.findFirst({
          orderBy: {
            contributions: {
              _count: 'desc'
            }
          },
          include: {
            contributions: true
          }
        })
      ]);

      return {
        totalUsers,
        totalContributions,
        topContributor: topContributor?.name || 'Anonymous User',
        mostBadges: badgeLeader?.name || 'Anonymous User',
        longestStreak: streakLeader?.longest || 0,
        highestLevel: levelLeader 
          ? this.calculateLevel(
              levelLeader.contributions.reduce((sum, c) => sum + c.points, 0)
            )
          : 0
      };
    }, { maxAge: this.CACHE_TTL });
  }

  private calculateLevel(points: number): number {
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  private mapUserToLeaderboardEntry(user: any, index: number): LeaderboardEntry {
    const points = user.contributions.reduce((sum: number, c: any) => sum + c.points, 0);
    return {
      userId: user.id,
      username: user.name || 'Anonymous User',
      avatar: user.image || undefined,
      rank: index + 1,
      points,
      contributions: user.contributions.length,
      badges: user.badges.length,
      streak: {
        current: user.streak?.current || 0,
        longest: user.streak?.longest || 0
      },
      level: this.calculateLevel(points)
    };
  }
}

export const leaderboardService = LeaderboardService.getInstance();
