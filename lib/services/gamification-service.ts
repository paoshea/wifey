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
      });

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const achievements = user.achievements;
      const userProgress = await this.getUserProgress(userId);
      const stats = user.stats?.stats as StatsContent || defaultStats;

      return achievements.map(achievement => ({
        ...achievement,
        requirements: this.validateRequirements(
          this.parseRequirements(achievement),
          stats
        ),
        tier: this.calculateTier(this.validateRequirements(this.parseRequirements(achievement), stats))
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
      const users = await this.prisma.user.findMany({
        take: pageSize,
        skip,
        include: {
          stats: true
        },
        orderBy: {
          stats: {
            points: 'desc'
          }
        }
      });

      const totalUsers = await this.prisma.user.count();
      const totalPages = Math.ceil(totalUsers / pageSize);

      const entries: LeaderboardEntry[] = users.map((user, index) => ({
        position: skip + index + 1,
        userId: user.id,
        username: user.name || 'Anonymous',
        points: user.stats?.points || 0,
        level: calculateLevel(user.stats?.points || 0)
      }));

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
          stats: true,
          streaks: true
        }
      });

      if (!user) {
        throw new UserNotFoundError(`User not found: ${userId}`);
      }

      const currentStats = user.stats?.stats as StatsContent || defaultStats;
      const streak = user.streaks?.[0]?.current || 0;
      const points = calculateMeasurementPoints(measurement);

      const updatedStats = this.calculateUpdatedStats(currentStats, measurement, streak);

      await this.prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          stats: updatedStats,
          points: points
        },
        update: {
          stats: updatedStats,
          points: {
            increment: points
          }
        }
      });

      return {
        points,
        updatedStats
      };
    } catch (error) {
      console.error('Error processing measurement:', error);
      throw error;
    }
  }

  private parseRequirements(achievement: Achievement): Requirement[] {
    try {
      return (achievement.requirements as Array<{
        metric: StatsMetric;
        operator: RequirementOperator;
        value: number;
      }>).map(req => ({
        metric: req.metric,
        operator: req.operator,
        value: req.value
      }));
    } catch (error) {
      console.error('Error parsing requirements:', error);
      return [];
    }
  }

  private validateRequirements(requirements: Requirement[], stats: StatsContent): ValidatedRequirement[] {
    return requirements.map(req => ({
      ...req,
      currentValue: this.getStatValue(req.metric, stats),
      isMet: this.checkRequirementMet(req, this.getStatValue(req.metric, stats))
    }));
  }

  private getStatValue(metric: StatsMetric, stats: StatsContent): number {
    return stats[metric] || 0;
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
      totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
      ruralMeasurements: measurement.isRural ? (currentStats.ruralMeasurements || 0) + 1 : (currentStats.ruralMeasurements || 0),
      uniqueLocations: (currentStats.uniqueLocations || 0) + (measurement.isUnique ? 1 : 0),
      totalDistance: (currentStats.totalDistance || 0) + (measurement.distance || 0),
      contributionScore: (currentStats.contributionScore || 0) + measurement.contributionScore,
      qualityScore: (currentStats.qualityScore || 0) + measurement.qualityScore,
      accuracyRate: ((currentStats.accuracyRate || 0) * (currentStats.totalMeasurements || 0) + measurement.accuracy) / ((currentStats.totalMeasurements || 0) + 1),
      verifiedSpots: (currentStats.verifiedSpots || 0),
      helpfulActions: (currentStats.helpfulActions || 0),
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
  async (userId: string) => {
    return await gamificationService.getUserProgress(userId);
  },
  { ttl: 300 } // 5 minutes cache
);
