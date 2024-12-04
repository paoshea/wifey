import { PrismaClient, Prisma, Achievement, LeaderboardEntry as PrismaLeaderboardEntry } from '@prisma/client';
import {
  type StatsContent,
  type ValidatedAchievement,
  type ValidatedRequirement,
  type LeaderboardEntry,
  type LeaderboardResponse,
  RequirementOperator,
  RequirementType,
  AchievementTier,
  TimeFrame,
  jsonToStats
} from '../gamification/types';
import {
  calculateLevel,
  validateRequirement
} from '../gamification/validation';
import {
  GamificationError,
  ValidationError,
  UserNotFoundError
} from '../gamification/errors';
import prisma from '../prisma';
import * as memoryCache from 'memory-cache';

interface CacheOptions {
  ttl?: number;
}

class GamificationCache {
  private cache: memoryCache.CacheClass<string, any>;
  private defaultTTL: number = 300; // 5 minutes default TTL

  constructor() {
    this.cache = new memoryCache.Cache();
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cachedValue = this.cache.get(key);
    if (cachedValue !== null) {
      return cachedValue as T;
    }

    const value = await fn();
    this.cache.put(key, value, options.ttl || this.defaultTTL * 1000);
    return value;
  }

  del(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

type AchievementWithUser = Prisma.AchievementGetPayload<{
  include: { user: true };
}>;

type LeaderboardEntryWithUser = Prisma.LeaderboardEntryGetPayload<{
  include: { user: true };
}>;

export class GamificationService {
  private apiCache: GamificationCache;
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
    this.apiCache = new GamificationCache();
  }

  async getTotalUsers(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const cacheKey = `totalUsers:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const dateFilter = this.getDateFilter(timeframe);
      return this.prisma.user.count();
    });
  }

  async getTotalContributions(timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number> {
    const cacheKey = `totalContributions:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const dateFilter = this.getDateFilter(timeframe);
      return this.prisma.coverageReport.count();
    });
  }

  private mapUserStatsToStatsContent(userStats: Prisma.UserStatsGetPayload<{}>): StatsContent {
    try {
      if (typeof userStats.stats !== 'object' || userStats.stats === null) {
        throw new ValidationError('Invalid stats format');
      }

      const statsData = jsonToStats(userStats.stats);
      return {
        ...statsData,
        points: userStats.points
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error parsing user stats:', err);
      return { ...defaultStats, points: userStats.points };
    }
  }

  private validateRequirements(requirements: Prisma.JsonValue): ValidatedRequirement[] {
    if (!Array.isArray(requirements)) {
      throw new ValidationError('Requirements must be an array');
    }

    return requirements.map(req => {
      if (!isValidRequirement(req)) {
        throw new ValidationError('Invalid requirement format');
      }

      if (!Object.values(RequirementType).includes(req.type as RequirementType)) {
        throw new ValidationError(`Invalid requirement type: ${req.type}`);
      }

      return {
        type: req.type as RequirementType,
        metric: req.metric as keyof StatsContent,
        value: req.value,
        operator: req.operator as RequirementOperator,
        description: req.description
      };
    });
  }

  private mapAchievementToValidated(achievement: Achievement): ValidatedAchievement {
    try {
      const requirementsData = this.validateRequirements(achievement.requirements);
      const target = requirementsData.length > 0 ? requirementsData[0].value : 100;

      return {
        id: achievement.id,
        userId: achievement.userId,
        title: achievement.title,
        description: achievement.description,
        points: achievement.points,
        icon: achievement.icon,
        type: achievement.type,
        tier: achievement.tier as AchievementTier,
        requirements: requirementsData,
        progress: achievement.progress,
        target,
        isCompleted: achievement.isCompleted,
        unlockedAt: achievement.unlockedAt,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error mapping achievement:', err);
      throw new ValidationError(`Invalid achievement data: ${err.message}`);
    }
  }

  private mapPrismaToLeaderboardEntry(entry: PrismaLeaderboardEntry): LeaderboardEntry {
    return {
      id: entry.id,
      timeframe: entry.timeframe as TimeFrame,
      points: entry.points,
      rank: entry.rank,
      username: entry.username,
      level: Math.floor(entry.points / 1000), // Calculate level from points
      contributions: entry.measurements,
      badges: 0, // This would need to be calculated from achievements if needed
      streak: {
        current: 0, // These would need to be fetched from UserStreak if needed
        longest: 0
      },
      recentAchievements: [], // This would need to be fetched from achievements if needed
      user: {
        id: entry.userId,
        name: entry.username,
        rank: entry.rank,
        measurements: entry.measurements,
        lastActive: entry.lastActive
      }
    };
  }

  async getAchievements(userId: string): Promise<ValidatedAchievement[]> {
    try {
      const achievements = await this.prisma.achievement.findMany({
        where: {
          userId
        }
      });
      return achievements.map(achievement => this.mapAchievementToValidated(achievement));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting achievements:', err);
      throw new GamificationError('Failed to fetch achievements', 'ACHIEVEMENT_FETCH_ERROR');
    }
  }

  async getUserProgress(userId: string): Promise<UserProgressData> {
    try {
      const [stats, streaks, achievements] = await Promise.all([
        this.prisma.userStats.findUnique({
          where: {
            userId
          }
        }),
        this.prisma.userStreak.findMany({
          where: {
            userId
          },
          orderBy: {
            lastCheckin: 'desc'
          },
          take: 1
        }),
        this.prisma.achievement.findMany({
          where: {
            userId
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      ]);

      if (!stats) {
        return {
          points: 0,
          level: 0,
          currentXP: 0,
          nextLevelXP: 1000,
          streak: {
            current: 0,
            longest: 0
          },
          stats: defaultStats,
          achievements: []
        };
      }

      const mappedStats = this.mapUserStatsToStatsContent(stats);
      const points = mappedStats.points;
      const level = calculateLevel(points);
      const currentXP = points % 1000;
      const nextLevelXP = 1000;

      return {
        points,
        level,
        currentXP,
        nextLevelXP,
        streak: {
          current: streaks[0]?.current ?? 0,
          longest: streaks[0]?.longest ?? 0
        },
        stats: mappedStats,
        achievements: achievements.map(achievement => this.mapAchievementToValidated(achievement))
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting user progress:', err);
      throw new GamificationError('Failed to fetch user progress', 'USER_PROGRESS_ERROR');
    }
  }

  async getLeaderboard(
    timeframe: TimeFrame = TimeFrame.ALL_TIME,
    page = 1,
    pageSize = 10
  ): Promise<LeaderboardResponse> {
    try {
      const skip = (page - 1) * pageSize;

      const [entries, totalUsers] = await Promise.all([
        this.prisma.leaderboardEntry.findMany({
          where: {
            timeframe
          },
          orderBy: {
            points: 'desc'
          },
          skip,
          take: pageSize
        }),
        this.prisma.leaderboardEntry.count({
          where: {
            timeframe
          }
        })
      ]);

      return {
        timeframe,
        entries: entries.map(entry => this.mapPrismaToLeaderboardEntry(entry)),
        totalUsers
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting leaderboard:', err);
      throw new GamificationError('Failed to fetch leaderboard', 'LEADERBOARD_ERROR');
    }
  }

  async getUserRank(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<number | null> {
    const cacheKey = `userRank:${userId}:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const entry = await this.prisma.leaderboardEntry.findFirst({
        where: {
          userId,
          timeframe
        },
        orderBy: {
          points: 'desc'
        }
      });

      return entry?.rank ?? null;
    });
  }

  async getLeaderboardPosition(userId: string, timeframe: TimeFrame = TimeFrame.ALL_TIME): Promise<LeaderboardEntry | null> {
    const cacheKey = `leaderboardPosition:${userId}:${timeframe}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const entry = await this.prisma.leaderboardEntry.findFirst({
        where: {
          userId,
          timeframe
        }
      });

      return entry ? this.mapPrismaToLeaderboardEntry(entry) : null;
    });
  }

  async getUserPoints(userId: string): Promise<number | null> {
    const cacheKey = `userPoints:${userId}`;
    return this.apiCache.wrap(cacheKey, async () => {
      const stats = await this.prisma.userStats.findUnique({
        where: {
          userId
        }
      });

      return stats?.points ?? null;
    });
  }

  private getDateFilter(timeframe: TimeFrame): { gte: Date } {
    const now = new Date();
    switch (timeframe) {
      case TimeFrame.DAILY:
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
      case TimeFrame.WEEKLY:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return { gte: weekStart };
      case TimeFrame.MONTHLY:
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
      case TimeFrame.ALL_TIME:
      default:
        return {
          gte: new Date(0) // Unix epoch
        };
    }
  }
}

export const gamificationService = new GamificationService();

// Wrapper functions for direct use with React Query
export const getCachedUserProgress = async (userId: string): Promise<UserProgressData> => {
  return gamificationService.getUserProgress(userId);
};

export const getCachedLeaderboard = async (timeframe: TimeFrame): Promise<LeaderboardResponse> => {
  return gamificationService.getLeaderboard(timeframe);
};

// Helper types and constants
const defaultStats: StatsContent = {
  points: 0,
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

interface UserProgressData {
  points: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: {
    current: number;
    longest: number;
  };
  stats: StatsContent;
  achievements?: ValidatedAchievement[];
}

function isValidRequirement(value: unknown): value is ValidatedRequirement {
  if (!value || typeof value !== 'object') return false;
  const req = value as Record<string, unknown>;
  return (
    typeof req.type === 'string' &&
    typeof req.metric === 'string' &&
    typeof req.value === 'number' &&
    typeof req.operator === 'string' &&
    (!req.description || typeof req.description === 'string')
  );
}
