// lib/services/gamification-service.ts

import { PrismaClient, Achievement, UserProgress, UserStats, Prisma } from '@prisma/client';
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
  RequirementSchema
} from '../gamification/types';
import {
  validateStatsContent,
  validateUserStats,
  validateUserProgress,
  validateMeasurement,
  validateRequirement,
  validateAchievementRequirements
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

class GamificationService {
  constructor(private readonly prisma: PrismaClient) { }

  // Achievement Management
  async getAchievements(userId: string): Promise<ValidatedAchievement[]> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: {
        stats: true,
        achievements: {
          include: { achievement: true }
        }
      }
    });

    if (!userProgress?.stats) {
      throw new Error('User stats not found');
    }

    const achievements = await this.prisma.achievement.findMany();

    return achievements.map(achievement => {
      const userAchievement = userProgress.achievements.find(
        ua => ua.achievementId === achievement.id
      );

      // Ensure requirements is an array and map each requirement
      const requirements = Array.isArray(achievement.requirements)
        ? achievement.requirements.map(req => {
          if (!req) return null;
          try {
            const currentValue = this.getStatValue(req.metric, userProgress.stats!.stats as StatsContent);
            const isMet = this.checkRequirementMet(req, currentValue);

            return {
              type: req.type as RequirementType,
              value: req.value as number,
              description: req.description as string,
              metric: req.metric as string,
              operator: req.operator as RequirementOperator,
              currentValue,
              isMet
            } as ValidatedRequirement;
          } catch {
            return null;
          }
        }).filter((req): req is ValidatedRequirement => req !== null)
        : [];

      // Validate requirements
      const validatedReqs = validateAchievementRequirements(requirements, userProgress.stats!.stats as StatsContent);

      const validatedAchievement: ValidatedAchievement = {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        tier: achievement.tier as AchievementTier,
        rarity: achievement.tier as AchievementTier,
        requirements: validatedReqs.data as ValidatedRequirement[],
        target: achievement.target ?? 0,
        progress: validatedReqs.progress,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      };

      return validatedAchievement;
    });
  }

  // Stats Management
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
    const mergedStats = StatsContentSchema.parse({
      ...existingStats,
      ...Object.entries(newStats).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {} as Record<StatsMetric, number>)
    }) as Prisma.JsonValue;

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

  // Measurement Processing
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

  // Helper Methods
  private getStatValue(metric: string, stats: StatsContent): number {
    const metricKey = metric as keyof StatsContent;
    return stats[metricKey] ?? 0;
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

  // Caching Methods
  async getCachedUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
    const cacheKey = `user-progress:${userId}`;
    return apiCache.getOrSet(cacheKey, () => this.getUserProgress(userId), 300);
  }

  async getCachedLeaderboard(
    timeframe: string = 'allTime',
    page: number = 1,
    pageSize: number = 10
  ): Promise<LeaderboardResponse> {
    const cacheKey = `leaderboard:${timeframe}:${page}:${pageSize}`;
    return apiCache.getOrSet(cacheKey, () => this.getLeaderboard(timeframe, page, pageSize), 300);
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

  async getLeaderboard(timeframe: string = 'allTime', page: number = 1, pageSize: number = 10): Promise<LeaderboardResponse> {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        timeframe
      },
      orderBy: {
        points: 'desc'
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return {
      entries: entries.map(entry => LeaderboardEntrySchema.parse({
        ...entry,
        userName: entry.user.name,
        userImage: entry.user.image
      })),
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(entries.length / pageSize)
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
        userId,
        stats: {
          create: {
            stats: initialStats
          }
        }
      }
    });

    return userProgress;
  }

  async updateStats(userProgress: UserProgress, validatedInput: ValidatedMeasurementInput, streak: number, tx: Prisma.TransactionClient): Promise<StatsContent> {
    const updatedStats = {
      ...userProgress.stats.stats,
      [StatsMetric.TOTAL_MEASUREMENTS]: userProgress.stats.stats[StatsMetric.TOTAL_MEASUREMENTS] + 1,
      [StatsMetric.RURAL_MEASUREMENTS]: validatedInput.rural ? userProgress.stats.stats[StatsMetric.RURAL_MEASUREMENTS] + 1 : userProgress.stats.stats[StatsMetric.RURAL_MEASUREMENTS],
      [StatsMetric.VERIFIED_SPOTS]: validatedInput.verified ? userProgress.stats.stats[StatsMetric.VERIFIED_SPOTS] + 1 : userProgress.stats.stats[StatsMetric.VERIFIED_SPOTS],
      [StatsMetric.HELPFUL_ACTIONS]: validatedInput.helpful ? userProgress.stats.stats[StatsMetric.HELPFUL_ACTIONS] + 1 : userProgress.stats.stats[StatsMetric.HELPFUL_ACTIONS],
      [StatsMetric.CONSECUTIVE_DAYS]: streak > 0 ? userProgress.stats.stats[StatsMetric.CONSECUTIVE_DAYS] + 1 : 1,
      [StatsMetric.QUALITY_SCORE]: validatedInput.qualityScore,
      [StatsMetric.ACCURACY_RATE]: validatedInput.accuracyRate,
      [StatsMetric.UNIQUE_LOCATIONS]: validatedInput.uniqueLocations,
      [StatsMetric.TOTAL_DISTANCE]: validatedInput.totalDistance,
      [StatsMetric.CONTRIBUTION_SCORE]: validatedInput.contributionScore
    };

    await tx.userStats.update({
      where: { userProgressId: userProgress.id },
      data: {
        stats: updatedStats
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
        const progress = calculateProgress(requirements, updatedStats);

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
        const progress = calculateProgress(requirements, updatedStats);

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

  private calculateStreak(lastActive: Date, now: Date): number {
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private calculateNewLevel(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    const level = calculateLevel(totalXP);
    const currentXP = totalXP - calculateRequiredXP(level - 1);
    const nextLevelXP = calculateRequiredXP(level);

    return { level, currentXP, nextLevelXP };
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
