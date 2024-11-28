// lib/services/gamification-service.ts

import { PrismaClient, Achievement, UserProgress, UserStats, Prisma, LeaderboardEntry } from '@prisma/client';
import {
  StatsContent,
  ValidatedLeaderboardEntry,
  ValidatedUserStats,
  ValidatedAchievement,
  AchievementTier,
  LeaderboardEntrySchema,
  AchievementSchema,
  StatsContentSchema,
  UserProgressSchema,
  ValidatedUserProgress,
  ValidatedRequirement,
  StatsMetric,
  Requirement,
  RequirementType,
  RequirementOperator,
  AchievementProgress,
  ValidatedMeasurementInput,
  TransactionContext,
  AchievementCheckResult,
  RequirementSchema,
  isValidStatsContent,
  AchievementNotification
} from '../gamification/types';
import {
  validateStatsContent,
  validateUserStats,
  validateUserProgress,
  validateMeasurement,
  validateRequirement,
  validateAchievementRequirements,
  calculateLevel,
  calculateRequiredXP
} from '../gamification/validation';
import {
  calculateMeasurementPoints,
  calculateAchievementXP,
  DEFAULT_ACHIEVEMENTS
} from '../gamification/achievements';
import {
  GamificationError,
  ValidationError,
  UserProgressNotFoundError,
  AchievementNotFoundError,
  DatabaseError,
  TransactionError
} from '../gamification/errors';
import { apiCache } from './api-cache';
import { LeaderboardResponse } from './leaderboard-service';
import { monitoringService } from '../monitoring/monitoring-service';
import { TimeFrame } from '@/lib/services/db/validation';

interface MeasurementResult {
  points: number;
  xp: number;
  bonuses: Record<string, number>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    tier: number;
  }>;
  newLevel?: number;
  newStats: StatsContent;
}

class GamificationService {
  constructor(private readonly prisma: PrismaClient) { }

  async getAchievements(userId: string): Promise<ValidatedAchievement[]> {
    try {
      const userProgress = await this.prisma.userProgress.findUnique({
        where: { userId },
        include: {
          stats: true,
          achievements: {
            include: { achievement: true }
          }
        }
      });

      if (!userProgress) {
        throw new UserProgressNotFoundError(`User progress not found for userId: ${userId}`);
      }

      if (!userProgress.stats) {
        throw new DatabaseError('User stats not found');
      }

      const achievements = await this.prisma.achievement.findMany();
      const statsContent = userProgress.stats.stats as StatsContent;

      if (!isValidStatsContent(statsContent)) {
        throw new ValidationError('Invalid stats content format');
      }

      return achievements.map(achievement => {
        const userAchievement = userProgress.achievements.find(
          ua => ua.achievementId === achievement.id
        );

        let requirements: ValidatedRequirement[] = [];

        try {
          if (achievement.requirements) {
            const parsedReqs = this.parseRequirements(achievement.requirements);
            requirements = parsedReqs.map(req => {
              if (!this.isValidRequirement(req)) {
                throw new ValidationError(`Invalid requirement format for achievement: ${achievement.id}`);
              }

              const currentValue = this.getStatValue(req.metric, statsContent);
              const isMet = this.checkRequirementMet(req, currentValue);

              return {
                ...req, // Include all base requirement properties
                currentValue,
                isMet
              } as ValidatedRequirement;
            });
          }

          const baseRequirements = requirements.map(({ type, value, description, metric, operator }) => ({
            type,
            value,
            description,
            metric,
            operator
          }));

          const validatedReqs = validateAchievementRequirements(baseRequirements, statsContent);
          const tier = this.calculateTier(requirements);

          const validatedAchievement: ValidatedAchievement = {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            tier,
            rarity: tier,
            requirements,
            progress: validatedReqs.progress,
            target: 100, // Each achievement requires 100% completion
            createdAt: achievement.createdAt,
            updatedAt: achievement.updatedAt
          };

          return validatedAchievement;
        } catch (error) {
          monitoringService.logError(error, 'error', userId, {
            context: 'GamificationService.getAchievements',
            achievementId: achievement.id
          });

          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            tier: AchievementTier.COMMON,
            rarity: AchievementTier.COMMON,
            requirements: [],
            progress: 0,
            target: 100, // Each achievement requires 100% completion
            createdAt: achievement.createdAt,
            updatedAt: achievement.updatedAt
          } as ValidatedAchievement;
        }
      });
    } catch (error) {
      if (error instanceof ValidationError ||
        error instanceof UserProgressNotFoundError ||
        error instanceof DatabaseError) {
        throw error;
      }
      throw new GamificationError('Failed to fetch achievements', 'ACHIEVEMENT_FETCH_ERROR', 500, error);
    }
  }

  private parseRequirements(requirements: Prisma.JsonValue): Requirement[] {
    if (!Array.isArray(requirements)) {
      throw new ValidationError('Requirements must be an array');
    }
    return requirements.map(req => {
      if (!req || typeof req !== 'object') {
        throw new ValidationError('Invalid requirement format');
      }
      return req as Requirement;
    });
  }

  private isValidRequirement(req: unknown): req is Requirement {
    if (!req || typeof req !== 'object') return false;

    const requirement = req as Partial<Requirement>;
    return (
      typeof requirement.type === 'string' &&
      typeof requirement.value === 'number' &&
      typeof requirement.description === 'string' &&
      typeof requirement.metric === 'string' &&
      typeof requirement.operator === 'string' &&
      Object.values(RequirementType).includes(requirement.type as RequirementType) &&
      Object.values(RequirementOperator).includes(requirement.operator as RequirementOperator)
    );
  }

  private getStatValue(metric: string, stats: StatsContent): number {
    const value = stats[metric as keyof StatsContent];
    if (typeof value !== 'number') {
      throw new ValidationError(`Invalid stat metric: ${metric}`);
    }
    return value;
  }

  private checkRequirementMet(requirement: Requirement, value: number): boolean {
    switch (requirement.operator) {
      case RequirementOperator.GREATER_THAN:
        return value > requirement.value;
      case RequirementOperator.GREATER_THAN_EQUAL:
        return value >= requirement.value;
      case RequirementOperator.LESS_THAN:
        return value < requirement.value;
      case RequirementOperator.LESS_THAN_EQUAL:
        return value <= requirement.value;
      case RequirementOperator.EQUAL:
        return value === requirement.value;
      case RequirementOperator.NOT_EQUAL:
        return value !== requirement.value;
      default:
        return false;
    }
  }

  private calculateAchievementProgress(requirements: ValidatedRequirement[]): number {
    if (!requirements.length) return 0;
    const metRequirements = requirements.filter(req => req.isMet);
    return (metRequirements.length / requirements.length) * 100;
  }

  private calculateTier(requirements: ValidatedRequirement[]): AchievementTier {
    const completedRequirements = requirements.filter(req => req.isMet).length;
    const totalRequirements = requirements.length;
    const ratio = completedRequirements / totalRequirements;

    if (ratio >= 0.9) return AchievementTier.LEGENDARY;
    if (ratio >= 0.7) return AchievementTier.EPIC;
    if (ratio >= 0.5) return AchievementTier.RARE;
    return AchievementTier.COMMON;
  }

  async updateUserStats(userId: string, newStats: Partial<StatsContent>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Initialize default stats
    const defaultStats: Record<StatsMetric, number> = {
      [StatsMetric.TOTAL_MEASUREMENTS]: 0,
      [StatsMetric.RURAL_MEASUREMENTS]: 0,
      [StatsMetric.VERIFIED_SPOTS]: 0,
      [StatsMetric.HELPFUL_ACTIONS]: 0,
      [StatsMetric.CONSECUTIVE_DAYS]: 0,
      [StatsMetric.QUALITY_SCORE]: 0,
      [StatsMetric.ACCURACY_RATE]: 0,
      [StatsMetric.UNIQUE_LOCATIONS]: 0,
      [StatsMetric.TOTAL_DISTANCE]: 0,
      [StatsMetric.CONTRIBUTION_SCORE]: 0
    };

    // Parse existing stats if they exist
    const existingStats = userProgress.stats?.stats
      ? (StatsContentSchema.parse(userProgress.stats.stats) as Record<StatsMetric, number>)
      : defaultStats;

    // Merge with new stats and validate
    const mergedStats = statsToJson({
      ...existingStats,
      ...Object.entries(newStats).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {} as Record<StatsMetric, number>)
    });

    // Update or create user stats
    await this.prisma.userStats.upsert({
      where: { userProgressId: userProgress.id },
      create: {
        userProgressId: userProgress.id,
        stats: mergedStats
      },
      update: {
        stats: mergedStats
      }
    });

    return userProgress;
  }

  async processMeasurement(userId: string, data: unknown): Promise<MeasurementResult> {
    const validatedInput = validateMeasurement(data);
    const initialStats: StatsContent = {
      [StatsMetric.TOTAL_MEASUREMENTS]: 0,
      [StatsMetric.RURAL_MEASUREMENTS]: 0,
      [StatsMetric.VERIFIED_SPOTS]: 0,
      [StatsMetric.HELPFUL_ACTIONS]: 0,
      [StatsMetric.CONSECUTIVE_DAYS]: 0,
      [StatsMetric.QUALITY_SCORE]: 0,
      [StatsMetric.ACCURACY_RATE]: 0,
      [StatsMetric.UNIQUE_LOCATIONS]: 0,
      [StatsMetric.TOTAL_DISTANCE]: 0,
      [StatsMetric.CONTRIBUTION_SCORE]: 0
    };

    try {
      return await this.prisma.$transaction(async tx => {
        const context: TransactionContext = { tx, userId, now: new Date() };
        let userProgress = await this.getUserProgressWithStats(userId, tx);

        if (!userProgress) {
          userProgress = await this.createInitialUserProgress(userId, initialStats, tx);
        }

        // Calculate streak and points
        const streak = this.calculateStreak(userProgress.lastActive, context.now);
        const { points, xp, bonuses } = calculateMeasurementPoints({
          ...validatedInput,
          streak
        });

        // Update stats
        const updatedStats = await this.updateStats(userProgress, validatedInput, streak, tx);

        // Update user progress
        const { level, currentXP, nextLevelXP } = this.calculateNewLevel(userProgress.totalXP + xp);
        const updatedProgress = await this.updateUserProgress(userProgress, points, level, currentXP, nextLevelXP, streak, context, tx);

        // Check achievements
        const achievements = await tx.achievement.findMany();
        const notifications = await this.checkAchievements(achievements, updatedStats, context);

        return {
          points,
          xp,
          bonuses,
          achievements: notifications,
          newLevel: level > userProgress.level ? level : undefined,
          newStats: updatedStats
        };
      });
    } catch (error) {
      if (error instanceof GamificationError) {
        throw error;
      }
      throw new TransactionError('Failed to process measurement', error);
    }
  }

  private calculateStreak(lastActive: Date, now: Date): number {
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private calculateProgress(achievement: Achievement, stats: StatsContent): number {
    if (!achievement.requirements || !Array.isArray(achievement.requirements)) {
      return 0;
    }

    try {
      const parsedReqs = this.parseRequirements(achievement.requirements);
      const metRequirements = parsedReqs.filter(req => {
        const value = this.getStatValue(req.metric, stats);
        return this.checkRequirementMet(req, value);
      });

      return metRequirements.length > 0
        ? (metRequirements.length / parsedReqs.length) * 100
        : 0;
    } catch (error) {
      monitoringService.logError(error, 'error', undefined, {
        context: 'GamificationService.calculateProgress',
        achievementId: achievement.id
      });
      return 0;
    }
  }

  private calculateNewLevel(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    const level = calculateLevel(totalXP);
    const currentXP = totalXP - calculateRequiredXP(level - 1);
    const nextLevelXP = calculateRequiredXP(level);

    return { level, currentXP, nextLevelXP };
  }

  async getCachedUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
    const cacheKey = `user-progress:${userId}`;
    return apiCache.fetch(cacheKey, () => this.getUserProgress(userId), {
      maxAge: 300 // 5 minutes
    });
  }

  async getCachedLeaderboard(
    timeframe: string = 'allTime',
    page: number = 1,
    pageSize: number = 10
  ): Promise<LeaderboardResponse> {
    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}`;
    return apiCache.fetch(cacheKey, () => this.getLeaderboard(timeframe, page, pageSize), {
      maxAge: 300 // 5 minutes
    });
  }

  public async getUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
    try {
      const progress = await this.prisma.userProgress.findUnique({
        where: { userId },
        include: {
          stats: true,
          achievements: {
            include: { achievement: true }
          }
        }
      });

      if (!progress) return null;

      return validateUserProgress(progress);
    } catch (error) {
      throw new DatabaseError('Failed to get user progress', error);
    }
  }

  public async getUserProgressData(userId: string): Promise<ValidatedUserProgress | null> {
    return this.getUserProgress(userId);
  }

  async getLeaderboard(
    timeframe: string = 'allTime',
    page: number = 1,
    pageSize: number = 10
  ): Promise<LeaderboardResponse> {
    type LeaderboardQueryResult = {
      id: string;
      points: number;
      rank: number;
      timeframe: string;
      updatedAt: Date;
      userId: string;
      user: {
        id: string;
        name: string;
        image: string | null;
      };
    };

    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        timeframe: timeframe as TimeFrame
      },
      orderBy: {
        points: 'desc'
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        points: true,
        rank: true,
        timeframe: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    }) as LeaderboardQueryResult[];

    const total = await this.prisma.leaderboardEntry.count({
      where: {
        timeframe: timeframe as TimeFrame
      }
    });

    return {
      entries: entries.map(entry => ({
        id: entry.id,
        points: entry.points,
        rank: entry.rank,
        userId: entry.userId,
        username: entry.user.name,
        level: 0, // These fields are required by LeaderboardEntry type
        streak: { current: 0, longest: 0 },
        contributions: 0,
        badges: 0,
        image: entry.user.image,
        timeframe: entry.timeframe,
        updatedAt: entry.updatedAt
      })),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: (page * pageSize) < total
      }
    };
  }

  async getUserProgressWithStats(userId: string, tx: Prisma.TransactionClient): Promise<UserProgress | null> {
    const progress = await tx.userProgress.findUnique({
      where: { userId },
      include: {
        stats: true,
        achievements: {
          include: { achievement: true }
        }
      }
    });

    return progress;
  }

  async createInitialUserProgress(userId: string, initialStats: StatsContent, tx: Prisma.TransactionClient): Promise<UserProgress> {
    const userProgress = await tx.userProgress.create({
      data: {
        userId: userId,
        level: 1,
        totalXP: 0,
        currentXP: 0,
        nextLevelXP: 100,
        points: 0,
        streak: 1,
        longestStreak: 1,
        lastActive: new Date(),
        stats: {
          create: {
            stats: statsToJson(initialStats) as Prisma.InputJsonValue,
            totalMeasurements: 0,
            ruralMeasurements: 0,
            uniqueLocations: 0,
            totalDistance: 0,
            contributionScore: 0,
            verifiedSpots: 0,
            helpfulActions: 0,
            consecutiveDays: 0,
            qualityScore: 0,
            accuracyRate: 0,
          }
        }
      },
      include: {
        stats: true
      }
    });

    return userProgress;
  }

  async updateStats(userProgress: UserProgress, measurement: ValidatedMeasurementInput, streak: number, tx: Prisma.TransactionClient): Promise<StatsContent> {
    const stats = await tx.userStats.findUnique({
      where: { userProgressId: userProgress.id }
    });

    if (!stats) {
      throw new Error(`Stats not found for user progress ${userProgress.id}`);
    }

    const currentStats = jsonToStats(stats.stats);
    const updatedStats = calculateUpdatedStats(currentStats, measurement, streak);

    await tx.userStats.update({
      where: { userProgressId: userProgress.id },
      data: {
        stats: statsToJson(updatedStats) as Prisma.InputJsonValue,
        totalMeasurements: { increment: 1 },
        ruralMeasurements: measurement.isRural ? { increment: 1 } : undefined,
        uniqueLocations: measurement.isFirstInArea ? { increment: 1 } : undefined,
        verifiedSpots: measurement.isVerified ? { increment: 1 } : undefined,
        helpfulActions: measurement.isHelpful ? { increment: 1 } : undefined,
        consecutiveDays: streak,
        qualityScore: { increment: measurement.qualityScore || 0 },
        accuracyRate: { increment: measurement.accuracyScore || 0 },
      }
    });

    return updatedStats;
  }

  async updateUserProgress(userProgress: UserProgress, points: number, level: number, currentXP: number, nextLevelXP: number, streak: number, context: TransactionContext, tx: Prisma.TransactionClient): Promise<UserProgress> {
    const updatedProgress = await tx.userProgress.update({
      where: { id: userProgress.id },
      data: {
        points: userProgress.points + points,
        level,
        totalXP: userProgress.totalXP + currentXP,
        nextLevelXP,
        streak,
        lastActive: context.now
      }
    });

    return updatedProgress;
  }

  async checkAchievements(achievements: Achievement[], updatedStats: StatsContent, context: TransactionContext): Promise<AchievementNotification[]> {
    const notifications: AchievementNotification[] = [];
    const userProgress = await this.getUserProgress(context.userId);

    if (!userProgress || !userProgress.stats) {
      throw new UserProgressNotFoundError(context.userId);
    }

    for (const achievement of achievements) {
      const requirements = Array.isArray(achievement.requirements)
        ? achievement.requirements
          .filter((req): req is Requirement => {
            try {
              return !!req && RequirementSchema.parse(req);
            } catch {
              return false;
            }
          })
          .map(req => {
            const currentValue = this.getStatValue(req.metric, userProgress.stats!.stats as StatsContent);
            const isMet = this.checkRequirementMet(req, currentValue);

            return {
              ...req,
              currentValue,
              isMet
            } as ValidatedRequirement;
          })
        : [];

      if (requirements.length === 0) continue;

      const userAchievement = await context.tx.userAchievement.findUnique({
        where: {
          userProgressId_achievementId: {
            userProgressId: context.userId,
            achievementId: achievement.id
          }
        }
      });

      if (!userAchievement) {
        const progress = this.calculateProgress(achievement, updatedStats);

        if (progress >= 1) {
          await context.tx.userAchievement.create({
            data: {
              userProgressId: context.userId,
              achievementId: achievement.id,
              progress,
              completed: true,
              unlockedAt: context.now
            }
          });

          notifications.push({
            achievementId: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            tier: achievement.tier as AchievementTier,
            rarity: achievement.tier as AchievementTier
          });
        } else {
          await context.tx.userAchievement.upsert({
            where: {
              userProgressId_achievementId: {
                userProgressId: context.userId,
                achievementId: achievement.id
              }
            },
            create: {
              userProgressId: context.userId,
              achievementId: achievement.id,
              progress,
              completed: false
            },
            update: {
              progress
            }
          });
        }
      } else {
        const progress = this.calculateProgress(achievement, updatedStats);

        if (progress >= 1 && !userAchievement.completed) {
          await context.tx.userAchievement.update({
            where: {
              userProgressId_achievementId: {
                userProgressId: context.userId,
                achievementId: achievement.id
              }
            },
            data: {
              progress,
              completed: true,
              unlockedAt: context.now
            }
          });

          notifications.push({
            achievementId: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            tier: achievement.tier as AchievementTier,
            rarity: achievement.tier as AchievementTier
          });
        } else {
          await context.tx.userAchievement.update({
            where: {
              userProgressId_achievementId: {
                userProgressId: context.userId,
                achievementId: achievement.id
              }
            },
            data: {
              progress
            }
          });
        }
      }
    }

    return notifications;
  }
}

// Export the class
export { GamificationService };

// Export a singleton instance
const prisma = new PrismaClient();
export const gamificationService = new GamificationService(prisma);

// Export helper functions that use the singleton instance
export const getCachedUserProgress = (userId: string) => gamificationService.getCachedUserProgress(userId);
export const getCachedLeaderboard = (timeframe: string = 'allTime', page: number = 1, pageSize: number = 10) =>
  gamificationService.getCachedLeaderboard(timeframe, page, pageSize);

function statsToJson(stats: StatsContent): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(stats));
}

function jsonToStats(json: Prisma.JsonValue): StatsContent {
  return JSON.parse(JSON.stringify(json));
}

function calculateUpdatedStats(currentStats: StatsContent, measurement: ValidatedMeasurementInput, streak: number): StatsContent {
  return {
    ...currentStats,
    [StatsMetric.TOTAL_MEASUREMENTS]: currentStats[StatsMetric.TOTAL_MEASUREMENTS] + 1,
    [StatsMetric.RURAL_MEASUREMENTS]: measurement.isRural ? currentStats[StatsMetric.RURAL_MEASUREMENTS] + 1 : currentStats[StatsMetric.RURAL_MEASUREMENTS],
    [StatsMetric.VERIFIED_SPOTS]: measurement.isVerified ? currentStats[StatsMetric.VERIFIED_SPOTS] + 1 : currentStats[StatsMetric.VERIFIED_SPOTS],
    [StatsMetric.HELPFUL_ACTIONS]: measurement.isHelpful ? currentStats[StatsMetric.HELPFUL_ACTIONS] + 1 : currentStats[StatsMetric.HELPFUL_ACTIONS],
    [StatsMetric.CONSECUTIVE_DAYS]: streak,
    [StatsMetric.QUALITY_SCORE]: currentStats[StatsMetric.QUALITY_SCORE] + (measurement.qualityScore || 0),
    [StatsMetric.ACCURACY_RATE]: currentStats[StatsMetric.ACCURACY_RATE] + (measurement.accuracyScore || 0),
    [StatsMetric.UNIQUE_LOCATIONS]: measurement.isFirstInArea ? currentStats[StatsMetric.UNIQUE_LOCATIONS] + 1 : currentStats[StatsMetric.UNIQUE_LOCATIONS],
    [StatsMetric.TOTAL_DISTANCE]: currentStats[StatsMetric.TOTAL_DISTANCE] + (measurement.totalDistance || 0),
    [StatsMetric.CONTRIBUTION_SCORE]: currentStats[StatsMetric.CONTRIBUTION_SCORE] + (measurement.contributionScore || 0)
  };
}
