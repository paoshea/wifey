// lib/services/gamification-service.ts

import { PrismaClient, type User, type Achievement, type UserStreak, type WifiSpot, type CoverageReport, type OperatorType, type Prisma } from '@prisma/client';
import {
  type StatsContent,
  type ValidatedAchievement,
  AchievementTier,
  type Requirement,
  RequirementOperator,
  type ValidatedMeasurementInput,
  type AchievementNotification,
  type ValidatedRequirement,
  type StatsMetric,
  type MeasurementResult,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type TimeFrame,
  type AchievementProgress
} from '../gamification/types';
import {
  validateMeasurement,
  validateRequirement,
  validateAchievementRequirements,
  calculateLevel,
  calculatePointsForMeasurement,
  calculateProgress
} from '../gamification/validation';
import {
  calculateMeasurementPoints,
  calculateAchievementXP,
  DEFAULT_ACHIEVEMENTS,
  type AchievementDefinition
} from '../gamification/achievements';
import {
  GamificationError,
  ValidationError,
  UserNotFoundError,
  AchievementNotFoundError,
  DatabaseError,
} from '../gamification/errors';
import { monitoringService } from '../monitoring/monitoring-service';
import { notificationService } from './notification-service';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { leaderboardService } from './leaderboard-service';

const AchievementRequirementSchema = z.object({
  metric: z.enum(['totalMeasurements', 'ruralMeasurements', 'uniqueLocations', 'totalDistance', 'contributionScore', 'qualityScore', 'accuracyRate', 'verifiedSpots', 'helpfulActions']),
  operator: z.enum(['GREATER_THAN', 'LESS_THAN', 'EQUAL', 'NOT_EQUAL', 'GREATER_THAN_EQUAL', 'LESS_THAN_EQUAL']),
  value: z.number()
});

type UserStatsSelect = Prisma.UserGetPayload<{
  select: {
    id: true;
    stats: {
      select: {
        points: true;
        stats: true;
      }
    }
  }
}>;

type UserWithStats = Prisma.UserGetPayload<{
  include: {
    stats: true;
  };
}>;

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    achievements: true;
    stats: true;
    streaks: true;
  };
}>;

interface UserProgress {
  points: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: {
    current: number;
    longest: number;
  };
  stats: StatsContent;
  achievements?: Achievement[];
}

interface UserStats {
  points: number;
  stats: StatsContent;
}

function isUserStats(stats: any): stats is UserStats {
  return stats && typeof stats.points === 'number' && typeof stats.stats === 'object';
}

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

import { Cache } from 'memory-cache';

interface CacheConfig {
  stdTTL: number;
  checkperiod: number;
  useClones: boolean;
}

interface CacheOptions {
  ttl?: number;
}

class GamificationCache {
  private cache: Cache<string, any>;
  private defaultTTL: number = 300; // 5 minutes default TTL

  constructor() {
    this.cache = new Cache();
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

export class GamificationService {
  private apiCache: GamificationCache;
  private prisma: PrismaClient;
  private leaderboardService: LeaderboardService;

  constructor(prismaClient: PrismaClient = prisma, leaderboardSvc: LeaderboardService = leaderboardService) {
    this.prisma = prismaClient;
    this.leaderboardService = leaderboardSvc;
    this.apiCache = new GamificationCache();
  }

  // Cache keys
  private static readonly LEADERBOARD_CACHE_KEY = 'leaderboard';
  private static readonly USER_STATS_CACHE_KEY = 'user_stats';
  private static readonly ACHIEVEMENTS_CACHE_KEY = 'achievements';

  async getAchievements(userId: string): Promise<ValidatedAchievement[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          achievements: true,
          stats: true,
          streaks: true
        },
      });

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const achievements = user.achievements;
      const userProgress = await this.getUserProgress(userId);
      const stats = user.stats?.stats as StatsContent || defaultStats;

      return achievements.map(achievement => ({
        ...achievement,
        requirements: this.parseRequirements(achievement),
        progress: this.calculateProgress(this.parseRequirements(achievement), stats),
        isCompleted: this.calculateProgress(this.parseRequirements(achievement), stats) === 100,
        tier: this.calculateTier(this.parseRequirements(achievement), stats)
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          stats: true,
          streaks: true,
          achievements: true
        }
      });

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const stats = user.stats?.stats as StatsContent || defaultStats;
      const points = user.stats?.points || 0;
      const level = calculateLevel(points);
      const currentXP = points % 1000;
      const nextLevelXP = 1000;

      return {
        points,
        level,
        currentXP,
        nextLevelXP,
        streak: {
          current: user.streaks?.[0]?.current || 0,
          longest: user.streaks?.[0]?.longest || 0
        },
        stats,
        achievements: user.achievements
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async getLeaderboard(
    timeframe: TimeFrame = 'allTime',
    page = 1,
    pageSize = 10
  ): Promise<LeaderboardResponse> {
    try {
      const skip = (page - 1) * pageSize;
      const totalUsers = await this.prisma.user.count();

      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          stats: {
            select: {
              points: true,
              stats: true
            }
          }
        },
        orderBy: {
          stats: {
            points: 'desc'
          }
        },
        skip,
        take: pageSize
      });

      const totalPages = Math.ceil(totalUsers / pageSize);

      const entries: LeaderboardEntry[] = users.map((user, index) => {
        const userStats = user.stats;
        const points = isUserStats(userStats) ? userStats.points : 0;
        const stats = isUserStats(userStats) ? userStats.stats as StatsContent : defaultStats;

        return {
          userId: user.id,
          username: user.name || 'Anonymous',
          points,
          rank: skip + index + 1,
          level: calculateLevel(points),
          achievements: 0,
          measurements: stats.totalMeasurements || 0,
          lastActive: new Date()
        };
      });

      return {
        entries,
        currentPage: page,
        totalPages,
        totalUsers
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  async getLeaderboardPosition(userId: string): Promise<{ position: number; totalUsers: number }> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          stats: {
            select: {
              points: true,
              stats: true
            }
          }
        },
        orderBy: {
          stats: {
            points: 'desc'
          }
        }
      });

      const position = users.findIndex(user => user.id === userId) + 1;
      const totalUsers = users.length;

      return {
        position,
        totalUsers
      };
    } catch (error) {
      console.error('Error getting leaderboard position:', error);
      throw new GamificationError('Failed to get leaderboard position');
    }
  }

  async processMeasurement(userId: string, measurement: ValidatedMeasurementInput): Promise<MeasurementResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userStats: true,
          streakHistory: {
            orderBy: {
              lastCheckin: 'desc'
            },
            take: 1
          }
        }
      });

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const currentStats = user.userStats?.statsData as StatsContent || defaultStats;
      const points = this.calculateBasePoints(measurement);
      const bonuses = this.calculateBonuses(measurement);
      const totalPoints = points + Object.values(bonuses).reduce((a, b) => a + b, 0);
      const xp = Math.round(totalPoints * 1.5); // XP is 1.5x points
      const streak = user.streakHistory[0]?.current ?? 0;
      const updatedStats = this.calculateUpdatedStats(currentStats, measurement, streak);

      const userStats = await this.prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          statsData: updatedStats,
          points: totalPoints
        },
        update: {
          statsData: updatedStats,
          points: {
            increment: totalPoints
          }
        }
      });

      // Create or update leaderboard entry
      await this.prisma.leaderboardEntry.upsert({
        where: {
          userId_timeframe: {
            userId,
            timeframe: TimeFrame.ALL_TIME
          }
        },
        create: {
          userId,
          timeframe: TimeFrame.ALL_TIME,
          points: totalPoints,
          rank: await this.calculateRank(totalPoints),
          stats: updatedStats
        },
        update: {
          points: {
            increment: totalPoints
          },
          stats: updatedStats
        }
      });

      return {
        points: {
          value: totalPoints,
          xp,
          bonuses
        },
        achievements: [], // Will be populated by achievement processor
        stats: updatedStats,
        xp
      };
    } catch (error) {
      console.error('Error processing measurement:', error);
      throw error;
    }
  }

  async getLeaderboard(
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getLeaderboard(TimeFrame.ALL_TIME, 1, limit);
  }

  async getUserStats(userId: string): Promise<StatsContent> {
    const cacheKey = `${GamificationService.USER_STATS_CACHE_KEY}_${userId}`;
    return this.apiCache.wrap(
      cacheKey,
      async () => {
        const userStats = await this.prisma.userStats.findUnique({
          where: { userId }
        });
        
        return userStats?.statsData as StatsContent || this.getDefaultStats();
      },
      { ttl: 300 } // 5 minutes TTL for user stats
    );
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const cacheKey = `${GamificationService.ACHIEVEMENTS_CACHE_KEY}_${userId}`;
    return this.apiCache.wrap(
      cacheKey,
      async () => {
        const achievements = await this.prisma.achievement.findMany({
          where: { userId }
        });
        return achievements;
      },
      { ttl: 300 } // 5 minutes TTL for achievements
    );
  }

  private parseRequirements(achievement: Achievement): ValidatedRequirement[] {
    try {
      if (!Array.isArray(achievement.requirements)) {
        throw new ValidationError('Achievement requirements must be an array');
      }

      return achievement.requirements.map(req => {
        const parsed = AchievementRequirementSchema.safeParse(req);
        if (!parsed.success) {
          throw new ValidationError(`Invalid requirement format: ${parsed.error.message}`);
        }
        return parsed.data;
      });
    } catch (error) {
      console.error('Error parsing requirements:', error);
      throw new ValidationError('Failed to parse achievement requirements');
    }
  }

  private async validateRequirements(
    achievement: Achievement,
    stats: UserStats['stats']
  ): Promise<boolean> {
    return achievement.requirements.every(req => validateRequirement(req, stats));
  }

  private calculateProgress(requirements: ValidatedRequirement[], stats: StatsContent): number {
    return calculateProgress({ requirements } as Achievement, stats);
  }

  private validateRequirement(
    requirement: ValidatedRequirement,
    stats: StatsContent
  ): boolean {
    const statValue = stats[requirement.metric] || 0;
    
    switch (requirement.operator) {
      case RequirementOperator.GREATER_THAN:
        return statValue > requirement.value;
      case RequirementOperator.LESS_THAN:
        return statValue < requirement.value;
      case RequirementOperator.EQUAL:
        return statValue === requirement.value;
      case RequirementOperator.NOT_EQUAL:
        return statValue !== requirement.value;
      case RequirementOperator.GREATER_THAN_EQUAL:
        return statValue >= requirement.value;
      case RequirementOperator.LESS_THAN_EQUAL:
        return statValue <= requirement.value;
      default:
        throw new ValidationError(`Unknown operator: ${requirement.operator}`);
    }
  }

  async validateAchievement(achievement: Achievement, stats: StatsContent): Promise<ValidatedAchievement> {
    const requirements = this.parseRequirements(achievement);
    const progress = this.calculateProgress(requirements, stats);
    const isCompleted = progress === 100;

    return {
      ...achievement,
      progress,
      isCompleted
    };
  }

  private calculateTier(requirements: ValidatedRequirement[], stats: StatsContent): AchievementTier {
    if (requirements.length === 0) return AchievementTier.BRONZE;
    
    const progress = this.calculateProgress(requirements, stats);
    if (progress >= 90) return AchievementTier.PLATINUM;
    if (progress >= 75) return AchievementTier.GOLD;
    if (progress >= 50) return AchievementTier.SILVER;
    return AchievementTier.BRONZE;
  }

  private calculateUpdatedStats(
    currentStats: StatsContent,
    measurement: ValidatedMeasurementInput,
    streak: number = 0
  ): StatsContent {
    const currentAccuracy = currentStats.accuracyRate || 0;
    const measurementAccuracy = measurement.stats.accuracy || 0;
    const totalMeasurements = (currentStats.totalMeasurements || 0);
    
    return {
      ...currentStats,
      totalMeasurements: totalMeasurements + 1,
      ruralMeasurements: measurement.isRural ? (currentStats.ruralMeasurements || 0) + 1 : (currentStats.ruralMeasurements || 0),
      uniqueLocations: measurement.stats.isUnique ? (currentStats.uniqueLocations || 0) + 1 : (currentStats.uniqueLocations || 0),
      totalDistance: (currentStats.totalDistance || 0) + measurement.stats.distance,
      contributionScore: (currentStats.contributionScore || 0) + measurement.stats.contributionScore,
      qualityScore: Math.round(((currentStats.qualityScore || 0) * totalMeasurements + measurement.stats.qualityScore) / (totalMeasurements + 1)),
      accuracyRate: measurement.stats.accuracy ? Math.round((currentAccuracy * totalMeasurements + measurementAccuracy) / (totalMeasurements + 1)) : currentAccuracy,
      consecutiveDays: streak,
      verifiedSpots: currentStats.verifiedSpots || 0,
      helpfulActions: currentStats.helpfulActions || 0
    };
  }

  private calculateBasePoints(measurement: ValidatedMeasurementInput): number {
    let points = 10; // Base points for any measurement
    
    // Quality multiplier
    const qualityMultiplier = measurement.stats.qualityScore / 100;
    points *= (1 + qualityMultiplier);
    
    // Distance bonus
    if (measurement.stats.distance > 0) {
      points += Math.min(measurement.stats.distance * 0.1, 50); // Cap at 50 points
    }
    
    // Contribution score bonus
    points += measurement.stats.contributionScore;
    
    return Math.round(points);
  }

  private calculateBonuses(measurement: ValidatedMeasurementInput): Record<string, number> {
    const bonuses: Record<string, number> = {};
    
    // Streak bonus
    if (measurement.streak > 0) {
      bonuses.streak = Math.min(measurement.streak * 2, 20); // Cap at 20 points
    }
    
    // Unique location bonus
    if (measurement.stats.isUnique) {
      bonuses.uniqueLocation = 15;
    }
    
    // Rural bonus
    if (measurement.isRural) {
      bonuses.rural = 25;
    }
    
    // First in area bonus
    if (measurement.isFirstInArea) {
      bonuses.firstInArea = 30;
    }
    
    // Accuracy bonus
    if (measurement.stats.accuracy && measurement.stats.accuracy > 90) {
      bonuses.highAccuracy = 10;
    }
    
    return bonuses;
  }

  async validateRequirements(
    achievement: Achievement,
    stats: UserStats['stats']
  ): Promise<boolean> {
    return achievement.requirements.every(req => {
      const statValue = stats[req.metric] || 0;
      
      switch (req.operator) {
        case RequirementOperator.GT:
          return statValue > req.value;
        case RequirementOperator.GTE:
          return statValue >= req.value;
        case RequirementOperator.LT:
          return statValue < req.value;
        case RequirementOperator.LTE:
          return statValue <= req.value;
        case RequirementOperator.EQ:
          return statValue === req.value;
        default:
          return false;
      }
    });
  }

  calculateAchievementProgress(
    achievement: Achievement,
    stats: UserStats['stats']
  ): number {
    const metRequirements = achievement.requirements.filter(req => {
      const statValue = stats[req.metric] || 0;
      
      switch (req.operator) {
        case RequirementOperator.GT:
          return statValue > req.value;
        case RequirementOperator.GTE:
          return statValue >= req.value;
        case RequirementOperator.LT:
          return statValue < req.value;
        case RequirementOperator.LTE:
          return statValue <= req.value;
        case RequirementOperator.EQ:
          return statValue === req.value;
        default:
          return false;
      }
    });

    return Math.round((metRequirements.length / achievement.requirements.length) * 100);
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
