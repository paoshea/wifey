// lib/services/db/gamification-db.ts

import { PrismaClient, Prisma, User, Achievement, UserStreak, CoverageReport } from '@prisma/client';
import { monitoringService } from '../../monitoring/monitoring-service';
import {
  validateUserProgress,
  validateMeasurement,
  userIdSchema,
  achievementIdSchema,
  handleValidationError,
} from './validation';
import {
  RequirementType,
  RequirementOperator,
  StatsContent,
  AchievementTier,
  ValidatedAchievement,
  TimeFrame,
  StatsMetric,
  AchievementRequirement as TypedAchievementRequirement
} from '../../gamification/types';
import { z } from 'zod';

const prisma = new PrismaClient();

// Interfaces
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
}

interface MeasurementData {
  type: 'wifi' | 'coverage';
  value: number;
  location?: {
    lat: number;
    lng: number;
  };
  operator?: string;
  device?: {
    type: string;
    model?: string;
  };
}

interface LeaderboardEntry {
  userId: string;
  points: number;
  rank: number;
  timeframe: TimeFrame;
  user: {
    name: string | null;
    id: string;
  };
}

interface ValidatedAchievementData extends Omit<Achievement, 'requirements'> {
  requirements: TypedAchievementRequirement[];
}

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

type StatsJson = {
  [K in keyof StatsContent]: number;
};

function parseStats(json: Prisma.JsonValue | null | undefined): StatsContent {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ...defaultStats };
  }

  const stats = json as Partial<StatsJson>;
  return {
    points: Number(stats.points) || 0,
    totalMeasurements: Number(stats.totalMeasurements) || 0,
    ruralMeasurements: Number(stats.ruralMeasurements) || 0,
    uniqueLocations: Number(stats.uniqueLocations) || 0,
    totalDistance: Number(stats.totalDistance) || 0,
    contributionScore: Number(stats.contributionScore) || 0,
    qualityScore: Number(stats.qualityScore) || 0,
    accuracyRate: Number(stats.accuracyRate) || 0,
    verifiedSpots: Number(stats.verifiedSpots) || 0,
    helpfulActions: Number(stats.helpfulActions) || 0,
    consecutiveDays: Number(stats.consecutiveDays) || 0
  };
}

function statsToJson(stats: StatsContent): Prisma.JsonObject {
  return {
    points: stats.points,
    totalMeasurements: stats.totalMeasurements,
    ruralMeasurements: stats.ruralMeasurements,
    uniqueLocations: stats.uniqueLocations,
    totalDistance: stats.totalDistance,
    contributionScore: stats.contributionScore,
    qualityScore: stats.qualityScore,
    accuracyRate: stats.accuracyRate,
    verifiedSpots: stats.verifiedSpots,
    helpfulActions: stats.helpfulActions,
    consecutiveDays: stats.consecutiveDays
  };
}

export class GamificationDB {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Achievement Methods
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const result = userIdSchema.safeParse(userId);
      if (!result.success) {
        throw result.error;
      }
      return await this.prisma.achievement.findMany({
        where: { userId }
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw handleValidationError(error);
    }
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<Achievement> {
    try {
      const userResult = userIdSchema.safeParse(userId);
      const achievementResult = achievementIdSchema.safeParse(achievementId);

      if (!userResult.success) throw userResult.error;
      if (!achievementResult.success) throw achievementResult.error;

      return await this.prisma.achievement.update({
        where: {
          id: achievementId,
          userId
        },
        data: {
          unlockedAt: new Date()
        }
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw handleValidationError(error);
    }
  }

  async checkAchievementProgress(userId: string, stats: StatsContent): Promise<Achievement[]> {
    try {
      const unlockedAchievements: Achievement[] = [];
      const pendingAchievements = await this.prisma.achievement.findMany({
        where: {
          userId,
          unlockedAt: null
        }
      });

      for (const achievement of pendingAchievements) {
        const validatedAchievement = this.validateAchievement(achievement);
        if (validatedAchievement && this.meetsRequirements(stats, validatedAchievement)) {
          const unlocked = await this.unlockAchievement(userId, achievement.id);
          unlockedAchievements.push(unlocked);
        }
      }

      return unlockedAchievements;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  private validateAchievement(achievement: Achievement): ValidatedAchievementData | null {
    try {
      const requirementsJson = achievement.requirements as Prisma.JsonArray;
      if (!Array.isArray(requirementsJson)) {
        return null;
      }

      const requirements: TypedAchievementRequirement[] = [];
      for (const req of requirementsJson) {
        if (typeof req === 'object' && req !== null && 'type' in req && 'metric' in req && 'value' in req && 'operator' in req) {
          const reqJson = req as {
            type: string;
            metric: string;
            value: number;
            operator: string;
            description?: string;
          };

          const type = RequirementType[reqJson.type as keyof typeof RequirementType];
          const metric = StatsMetric[reqJson.metric as keyof typeof StatsMetric];
          const operator = RequirementOperator[reqJson.operator as keyof typeof RequirementOperator];

          if (type !== undefined && metric !== undefined && operator !== undefined) {
            requirements.push({
              type,
              metric,
              value: Number(reqJson.value),
              operator,
              description: reqJson.description
            });
          }
        }
      }

      if (!requirements.length) {
        return null;
      }

      return {
        ...achievement,
        requirements
      };
    } catch {
      return null;
    }
  }

  private meetsRequirements(stats: StatsContent, achievement: ValidatedAchievementData): boolean {
    return achievement.requirements.every(req => this.checkRequirement(stats, req));
  }

  private checkRequirement(stats: StatsContent, requirement: TypedAchievementRequirement): boolean {
    const metricKey = requirement.metric;
    const statValue = stats[metricKey as keyof StatsContent] || 0;
    const targetValue = requirement.value;

    switch (requirement.operator) {
      case RequirementOperator.GREATER_THAN:
        return statValue > targetValue;
      case RequirementOperator.GREATER_THAN_EQUAL:
        return statValue >= targetValue;
      case RequirementOperator.LESS_THAN:
        return statValue < targetValue;
      case RequirementOperator.LESS_THAN_EQUAL:
        return statValue <= targetValue;
      case RequirementOperator.EQUAL:
        return statValue === targetValue;
      case RequirementOperator.NOT_EQUAL:
        return statValue !== targetValue;
      default:
        return false;
    }
  }

  // User Progress Methods
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          streaks: true,
          achievements: true,
          stats: true
        },
      });

      if (!user) return null;

      const streak = user.streaks[0] || { current: 0, longest: 0 };
      const stats = parseStats(user.stats?.stats);

      return {
        points: stats.points,
        level: Math.floor(Math.sqrt(stats.points / 100)) + 1,
        currentXP: stats.points % 100,
        nextLevelXP: (Math.floor(Math.sqrt(stats.points / 100)) + 2) * 100,
        streak: {
          current: streak.current,
          longest: streak.longest,
        },
        stats,
      };
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async updateUserProgress(userId: string, points: number): Promise<void> {
    try {
      const currentStats = await this.prisma.userStats.findUnique({
        where: { userId },
        select: { stats: true }
      });

      const stats = parseStats(currentStats?.stats);
      stats.points += points;

      const jsonStats = statsToJson(stats);

      await this.prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          stats: jsonStats
        },
        update: {
          stats: jsonStats
        }
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  // Measurement Processing Methods
  async processMeasurement(
    userId: string,
    measurement: MeasurementData,
  ): Promise<{
    points: number;
    achievements: Achievement[];
  }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Update user points based on measurement type
        const pointsEarned = measurement.type === 'wifi' ? 10 : 5;

        // Create the appropriate record
        if (measurement.type === 'wifi' && measurement.location) {
          await tx.measurement.create({
            data: {
              userId,
              latitude: measurement.location.lat,
              longitude: measurement.location.lng,
              signalStrength: measurement.value,
              provider: 'wifi',
              connectionType: measurement.device?.type || 'unknown',
              networkType: 'wifi',
              timestamp: new Date(),
            },
          });
        } else if (measurement.type === 'coverage' && measurement.location && measurement.operator) {
          await tx.coverageReport.create({
            data: {
              userId,
              latitude: measurement.location.lat,
              longitude: measurement.location.lng,
              signal: BigInt(measurement.value),
              operator: measurement.operator,
              networkType: 'cellular',
              deviceModel: measurement.device?.model || 'unknown',
              connectionType: measurement.device?.type || 'unknown',
              points: BigInt(pointsEarned),
            },
          });
        }

        // Update user stats with points
        const currentStats = await tx.userStats.findUnique({
          where: { userId },
          select: { stats: true }
        });

        const stats = parseStats(currentStats?.stats);
        stats.points += pointsEarned;

        const jsonStats = statsToJson(stats);

        await tx.userStats.upsert({
          where: { userId },
          create: {
            userId,
            stats: jsonStats
          },
          update: {
            stats: jsonStats
          }
        });

        // Check for new achievements
        const achievements = await tx.achievement.findMany({
          where: { userId, unlockedAt: null },
        });

        return {
          points: pointsEarned,
          achievements,
        };
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  // Leaderboard Methods
  async getLeaderboard(
    timeframe: TimeFrame,
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const userStats = await this.prisma.userStats.findMany({
        take: limit,
        orderBy: {
          points: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return userStats.map((stats, index) => {
        const parsedStats = parseStats(stats.stats);
        return {
          userId: stats.userId,
          points: parsedStats.points,
          rank: index + 1,
          timeframe,
          user: {
            name: stats.user.name,
            id: stats.user.id,
          },
        };
      });
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }

  async calculateUserRank(userId: string): Promise<number> {
    try {
      const userStats = await this.prisma.userStats.findUnique({
        where: { userId },
        select: { stats: true }
      });

      if (!userStats) return 0;

      const stats = parseStats(userStats.stats);
      const userPoints = stats.points;

      const higherRankedCount = await this.prisma.userStats.count({
        where: {
          points: {
            gt: userPoints
          }
        }
      });

      return higherRankedCount + 1;
    } catch (error) {
      await monitoringService.logError(error);
      throw error;
    }
  }
}

export const gamificationDB = new GamificationDB();
