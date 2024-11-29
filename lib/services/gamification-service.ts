// lib/services/gamification-service.ts

import { PrismaClient, type User, type Achievement, type UserStreak, type WifiSpot, type CoverageReport, type OperatorType, type Prisma } from '@prisma/client';
import {
  type StatsContent,
  type ValidatedAchievement,
  type AchievementTier,
  type Requirement,
  type RequirementOperator,
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
  calculatePointsForMeasurement
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
import { apiCache } from './api-cache';
import { monitoringService } from '../monitoring/monitoring-service';
import { notificationService } from './notification-service';
import { prisma } from '@/lib/prisma';

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

export class GamificationService {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async getAchievements(userId: string): Promise<ValidatedAchievement[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          achievements: true,
          stats: true,
          streaks: true
        },
      }) as UserWithRelations | null;

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const achievements = user.achievements;
      const userProgress = await this.getUserProgress(userId);
      const stats = user.stats?.stats ? (user.stats.stats as Prisma.JsonValue as StatsContent) : defaultStats;

      return achievements.map(achievement => {
        const requirements = this.parseRequirements(achievement);
        const validatedReqs = this.validateRequirements(requirements, stats);
        const tier = this.calculateTier(validatedReqs);

        return {
          ...achievement,
          tier,
          rarity: tier,
          requirements: validatedReqs,
          progress: this.calculateProgress(validatedReqs),
          target: 100
        };
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const cachedProgress = await apiCache.get(`user-progress:${userId}`);
      if (cachedProgress) {
        return cachedProgress;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          streaks: true,
          achievements: true,
          stats: true
        },
      }) as UserWithRelations | null;

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const streak = user.streaks[0] || { current: 0, longest: 0 };
      const level = calculateLevel(user.points ?? 0);
      const nextLevelXP = (level + 1) * 100;
      const stats = user.stats?.stats ? (user.stats.stats as Prisma.JsonValue as StatsContent) : defaultStats;

      const progress: UserProgress = {
        points: user.points ?? 0,
        level,
        currentXP: (user.points ?? 0) % 100,
        nextLevelXP,
        streak: {
          current: streak.current,
          longest: streak.longest
        },
        stats,
        achievements: user.achievements
      };

      await apiCache.set(`user-progress:${userId}`, progress);
      return progress;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async processMeasurement(userId: string, measurement: ValidatedMeasurementInput): Promise<MeasurementResult> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            streaks: true,
            achievements: true,
            stats: true
          },
        }) as UserWithRelations | null;

        if (!user) {
          throw new UserNotFoundError(`User not found: ${userId}`);
        }

        const points = calculatePointsForMeasurement(measurement);
        const xp = calculateAchievementXP(points);

        const measurementData: MeasurementCreate = {
          type: measurement.type,
          name: measurement.name || 'Measurement',
          location: measurement.location,
          value: measurement.value,
          speed: measurement.speed ?? 0,
          security: measurement.type === 'wifi' ? measurement.security ?? 'unknown' : undefined,
          operator: measurement.type === 'coverage' ? measurement.operator : undefined,
          points,
          userId,
          isRural: measurement.isRural,
          distance: measurement.distance
        };

        if (measurement.type === 'wifi') {
          await tx.wifiSpot.create({
            data: {
              name: measurementData.name,
              latitude: measurementData.location.lat,
              longitude: measurementData.location.lng,
              signal: measurementData.value,
              speed: measurementData.speed,
              security: measurementData.security!,
              points: measurementData.points,
              userId: measurementData.userId,
            },
          });
        } else {
          await tx.coverageReport.create({
            data: {
              operator: measurementData.operator as OperatorType,
              latitude: measurementData.location.lat,
              longitude: measurementData.location.lng,
              signal: measurementData.value,
              speed: measurementData.speed,
              points: measurementData.points,
              userId: measurementData.userId,
            },
          });
        }

        // Update user points and stats
        const stats = user.stats?.stats ? (user.stats.stats as Prisma.JsonValue as StatsContent) : defaultStats;
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            points: { increment: points },
            stats: {
              upsert: {
                create: { 
                  stats: this.calculateUpdatedStats(stats, measurement, user.streaks[0]?.current || 0) as Prisma.JsonValue
                },
                update: { 
                  stats: this.calculateUpdatedStats(stats, measurement, user.streaks[0]?.current || 0) as Prisma.JsonValue
                }
              }
            }
          },
          include: {
            achievements: true,
            streaks: true,
            stats: true
          },
        }) as UserWithRelations;

        // Update streak
        const now = new Date();
        const streak = await tx.userStreak.upsert({
          where: { userId },
          create: {
            userId,
            current: 1,
            longest: 1,
            lastCheckin: now,
          },
          update: {
            current: { increment: 1 },
            longest: { increment: 1 },
            lastCheckin: now,
          },
        });

        const newStats = this.calculateUpdatedStats(stats, measurement, streak.current);

        // Check for new achievements
        const achievementNotifications: AchievementNotification[] = [];
        const unlockedAchievements = updatedUser.achievements
          .filter(a => !a.unlockedAt)
          .filter(a => {
            const requirements = this.parseRequirements(a);
            const validatedReqs = this.validateRequirements(requirements, newStats);
            return validatedReqs.every(r => r.isMet);
          });

        for (const achievement of unlockedAchievements) {
          await tx.achievement.update({
            where: { id: achievement.id },
            data: { unlockedAt: now }
          });
          achievementNotifications.push({
            achievement,
            pointsEarned: achievement.points,
            newLevel: calculateLevel(updatedUser.points ?? 0)
          });
        }

        return {
          points,
          xp,
          bonuses: {},
          achievements: achievementNotifications,
          newLevel: calculateLevel(updatedUser.points ?? 0),
          newStats,
        };
      });

      // Send notifications outside transaction
      for (const notification of result.achievements) {
        await notificationService.sendAchievementNotification(userId, notification);
      }

      await apiCache.invalidate(`user-progress:${userId}`);
      return result;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async getLeaderboard(
    timeframe: TimeFrame = 'allTime',
    page = 1,
    pageSize = 10
  ): Promise<LeaderboardResponse> {
    try {
      const cachedLeaderboard = await apiCache.get(`leaderboard:${timeframe}:${page}:${pageSize}`);
      if (cachedLeaderboard) {
        return cachedLeaderboard;
      }

      const skip = (page - 1) * pageSize;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: pageSize,
          orderBy: { points: 'desc' },
          include: {
            streaks: true,
            achievements: true,
            stats: true
          },
        }) as Promise<UserWithRelations[]>,
        this.prisma.user.count(),
      ]);

      const entries: LeaderboardEntry[] = users.map((user, index) => {
        const streak = user.streaks[0] || { current: 0, longest: 0 };
        const level = calculateLevel(user.points ?? 0);
        const stats = user.stats?.stats ? (user.stats.stats as Prisma.JsonValue as StatsContent) : defaultStats;

        return {
          id: user.id,
          rank: skip + index + 1,
          userId: user.id,
          username: user.name ?? 'Anonymous',
          points: user.points ?? 0,
          level,
          streak: {
            current: streak.current,
            longest: streak.longest
          },
          contributions: stats.totalMeasurements ?? 0,
          badges: user.achievements?.length ?? 0,
          image: user.image
        };
      });

      const leaderboard: LeaderboardResponse = {
        entries,
        pagination: {
          total,
          page,
          pageSize,
          hasMore: skip + pageSize < total
        }
      };

      await apiCache.set(`leaderboard:${timeframe}:${page}:${pageSize}`, leaderboard);
      return leaderboard;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async getLeaderboardPosition(userId: string): Promise<{ position: number; totalUsers: number }> {
    try {
      // Get all users ordered by points
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          stats: {
            select: {
              points: true
            }
          }
        },
        orderBy: {
          stats: {
            points: 'desc'
          }
        }
      });

      // Find the position of the user
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

  private parseRequirements(achievement: Achievement): Requirement[] {
    try {
      const requirements = achievement.requirements as unknown as Array<{
        metric: StatsMetric;
        operator: RequirementOperator;
        value: number | string;
      }>;

      return requirements.map(req => ({
        metric: req.metric,
        operator: req.operator,
        value: Number(req.value),
        currentValue: 0,
        isMet: false
      }));
    } catch (error) {
      monitoringService.logError(error);
      return [];
    }
  }

  private validateRequirements(requirements: Requirement[], stats: StatsContent): ValidatedRequirement[] {
    return requirements.map(req => {
      const currentValue = this.getStatValue(req.metric, stats);
      const isMet = this.checkRequirementMet(req, currentValue);
      return {
        ...req,
        currentValue,
        isMet,
      };
    });
  }

  private getStatValue(metric: StatsMetric, stats: StatsContent): number {
    return stats[metric] ?? 0;
  }

  private checkRequirementMet(req: Requirement, value: number): boolean {
    switch (req.operator) {
      case 'gt':
        return value > req.value;
      case 'gte':
        return value >= req.value;
      case 'lt':
        return value < req.value;
      case 'lte':
        return value <= req.value;
      case 'eq':
        return value === req.value;
      default:
        return false;
    }
  }

  private calculateTier(requirements: ValidatedRequirement[]): AchievementTier {
    if (requirements.length === 0) return 'bronze';
    const progress = this.calculateProgress(requirements);
    if (progress >= 90) return 'legendary';
    if (progress >= 75) return 'epic';
    if (progress >= 50) return 'rare';
    return 'common';
  }

  private calculateProgress(requirements: ValidatedRequirement[]): number {
    if (requirements.length === 0) return 0;
    const metRequirements = requirements.filter(r => r.isMet).length;
    return Math.round((metRequirements / requirements.length) * 100);
  }

  private calculateUpdatedStats(
    currentStats: StatsContent,
    measurement: ValidatedMeasurementInput,
    streak: number
  ): StatsContent {
    return {
      ...currentStats,
      totalMeasurements: (currentStats.totalMeasurements ?? 0) + 1,
      ruralMeasurements: measurement.isRural ? (currentStats.ruralMeasurements ?? 0) + 1 : (currentStats.ruralMeasurements ?? 0),
      uniqueLocations: (currentStats.uniqueLocations ?? 0) + 1,
      totalDistance: (currentStats.totalDistance ?? 0) + (measurement.distance ?? 0),
      contributionScore: (currentStats.contributionScore ?? 0) + measurement.value,
      qualityScore: Math.round(((currentStats.qualityScore ?? 0) * (currentStats.totalMeasurements ?? 0) + measurement.value) / ((currentStats.totalMeasurements ?? 0) + 1)),
      accuracyRate: (currentStats.accuracyRate ?? 0),
      verifiedSpots: (currentStats.verifiedSpots ?? 0),
      helpfulActions: (currentStats.helpfulActions ?? 0),
      consecutiveDays: streak
    };
  }
}

// Export the class type
export type { GamificationService };

// Export singleton instance
export const gamificationService = new GamificationService();

// Export cached functions with proper types
export const getCachedUserProgress = apiCache.wrap<string, UserProgress>(
  'user-progress',
  async (userId: string) => gamificationService.getUserProgress(userId)
);

export const getCachedLeaderboard = apiCache.wrap<[TimeFrame?, number?, number?], LeaderboardResponse>(
  'leaderboard',
  async (timeframe: TimeFrame = 'allTime', page = 1, pageSize = 10) => 
    gamificationService.getLeaderboard(timeframe, page, pageSize)
);

// Export types
export type { UserProgress, UserWithRelations };
