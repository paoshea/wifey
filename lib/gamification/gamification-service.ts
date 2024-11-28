// lib/gamification/gamification-service.ts

import { PrismaClient, Achievement, UserProgress, UserStats, Prisma } from '@prisma/client';
import {
  ValidatedAchievement,
  ValidatedUserStats,
  ValidatedUserProgress,
  AchievementProgress,
  AchievementNotification,
  StatsUpdate,
  MeasurementResult,
  ValidatedMeasurementInput,
  TransactionContext,
  AchievementCheckResult,
  StatsContent,
  StatsContentSchema,
  RequirementType,
  RequirementOperator,
  AchievementTier,
  StatsMetric,
  ValidatedLeaderboardEntry,
  Requirement
} from './types';
import {
  validateAchievement,
  validateUserStats,
  validateStatsContent,
  validateUserProgress,
  validateMeasurementInput,
  checkRequirementMet,
  calculateProgress,
  calculateLevel,
  calculateRequiredXP
} from './validation';
import {
  calculateMeasurementPoints,
  calculateAchievementXP,
  DEFAULT_ACHIEVEMENTS
} from './achievements';
import {
  GamificationError,
  ValidationError,
  UserProgressNotFoundError,
  AchievementNotFoundError,
  DatabaseError,
  TransactionError
} from './errors';

export class GamificationService {
  constructor(private prisma: PrismaClient) { }

  async getAchievements(userId: string): Promise<AchievementProgress[]> {
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
        throw new UserProgressNotFoundError(userId);
      }

      const achievements = await this.prisma.achievement.findMany();
      return await Promise.all(achievements.map(async achievement => {
        const userAchievement = userProgress.achievements.find(
          ua => ua.achievementId === achievement.id
        );

        if (!userAchievement) {
          // Create a new user achievement if it doesn't exist
          const newUserAchievement = await this.prisma.userAchievement.create({
            data: {
              userProgressId: userProgress.id,
              achievementId: achievement.id,
              progress: 0,
              target: achievement.target,
              completed: false
            },
            include: {
              achievement: true
            }
          });

          // Convert to AchievementProgress type
          return {
            ...newUserAchievement,
            isCompleted: newUserAchievement.completed,
            completedAt: newUserAchievement.unlockedAt,
            target: achievement.target ?? undefined,
            achievement: {
              ...newUserAchievement.achievement,
              rarity: newUserAchievement.achievement.tier as AchievementTier,
              tier: newUserAchievement.achievement.tier as AchievementTier,
              progress: 0,
              target: achievement.target ?? 100,
              requirements: Array.isArray(achievement.requirements) 
                ? achievement.requirements 
                : []
            }
          };
        }

        // Return existing achievement with target
        const existingAchievement = await this.prisma.userAchievement.findUnique({
          where: { id: userAchievement.id },
          include: {
            achievement: true
          }
        });

        if (!existingAchievement) {
          throw new Error(`Achievement ${userAchievement.id} not found`);
        }

        // Convert to AchievementProgress type
        return {
          ...existingAchievement,
          isCompleted: existingAchievement.completed,
          completedAt: existingAchievement.unlockedAt,
          target: achievement.target ?? undefined,
          achievement: {
            ...existingAchievement.achievement,
            rarity: existingAchievement.achievement.tier as AchievementTier,
            tier: existingAchievement.achievement.tier as AchievementTier,
            progress: existingAchievement.progress,
            target: achievement.target ?? 100,
            requirements: Array.isArray(existingAchievement.achievement.requirements) 
              ? existingAchievement.achievement.requirements 
              : []
          }
        };
      }));
    } catch (error) {
      if (error instanceof GamificationError) {
        throw error;
      }
      throw new DatabaseError('Failed to get achievements', error);
    }
  }

  async processMeasurement(userId: string, data: unknown): Promise<MeasurementResult> {
    const validatedInput = validateMeasurementInput(data);
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

        let userProgress = await tx.userProgress.findUnique({
          where: { userId },
          include: { stats: true }
        });

        if (!userProgress) {
          const initialUserProgress = await tx.userProgress.create({
            data: {
              userId,
              totalPoints: 0,
              level: 1,
              currentXP: 0,
              totalXP: 0,
              nextLevelXP: calculateRequiredXP(1),
              streak: 0,
              lastActive: context.now,
              unlockedAchievements: 0,
            }
          });

          // Create stats separately to ensure proper typing
          const initialUserStats = await tx.userStats.create({
            data: {
              userProgress: { connect: { id: initialUserProgress.id } },
              stats: initialStats as Prisma.InputJsonValue
            }
          });

          // Fetch the complete user progress with stats
          userProgress = await tx.userProgress.findUnique({
            where: { id: initialUserProgress.id },
            include: { stats: true }
          });

          if (!userProgress) {
            throw new GamificationError(
              'Failed to create user progress',
              'CREATE_USER_PROGRESS_FAILED'
            );
          }
        }

        // At this point userProgress is guaranteed to exist
        const progress = userProgress;
        if (!progress) {
          throw new GamificationError(
            'Failed to create or find user progress',
            'USER_PROGRESS_NOT_FOUND'
          );
        }

        // Calculate streak
        const lastActive = progress.lastActive;
        const daysSinceLastActive = Math.floor((context.now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const streak = daysSinceLastActive === 1 ? progress.streak + 1 : 1;

        // Calculate points and XP
        const { points, xp, bonuses } = calculateMeasurementPoints({
          ...validatedInput,
          streak
        });

        // Update stats
        const currentStats = validateStatsContent(progress.stats?.stats ?? initialStats);
        const updatedStats: StatsContent = {
          ...currentStats,
          [StatsMetric.TOTAL_MEASUREMENTS]: (currentStats[StatsMetric.TOTAL_MEASUREMENTS] ?? 0) + 1,
          [StatsMetric.RURAL_MEASUREMENTS]: validatedInput.isRural ?
            (currentStats[StatsMetric.RURAL_MEASUREMENTS] ?? 0) + 1 :
            (currentStats[StatsMetric.RURAL_MEASUREMENTS] ?? 0),
          [StatsMetric.QUALITY_SCORE]: validatedInput.quality,
          [StatsMetric.CONSECUTIVE_DAYS]: streak
        };

        // Create or update user stats
        await tx.userStats.upsert({
          where: { userProgressId: progress.id },
          create: {
            userProgress: { connect: { id: progress.id } },
            stats: updatedStats as Prisma.InputJsonValue
          },
          update: {
            stats: updatedStats as Prisma.InputJsonValue
          }
        });

        // Update user progress
        const totalXP = progress.totalXP + xp;
        const { level, currentXP, nextLevelXP } = calculateLevel(totalXP);
        const newLevel = level > progress.level ? level : undefined;

        const updatedProgress = await tx.userProgress.update({
          where: { id: progress.id },
          data: {
            totalPoints: progress.totalPoints + points,
            level,
            currentXP,
            totalXP,
            nextLevelXP,
            streak,
            lastActive: context.now
          },
          include: { stats: true }
        });

        // Check achievements
        const achievements = await tx.achievement.findMany();
        const notifications: AchievementNotification[] = [];

        for (const achievement of achievements) {
          const result = await this.checkAchievement(achievement, updatedStats, context);
          if (result.notification) {
            notifications.push(result.notification);
          }
        }

        return {
          points,
          xp,
          bonuses,
          achievements: notifications,
          newLevel,
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

  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'): Promise<ValidatedLeaderboardEntry[]> {
    try {
      const leaderboard = await this.prisma.userProgress.findMany({
        orderBy: {
          totalPoints: 'desc'
        },
        take: 100
      });

      return leaderboard.map((entry, index) => ({
        id: entry.id,
        userId: entry.userId,
        timeframe,
        points: entry.totalPoints,
        rank: index + 1,
        updatedAt: entry.updatedAt
      }));
    } catch (error) {
      throw new DatabaseError('Failed to fetch leaderboard', error);
    }
  }

  private async checkAchievement(
    achievement: Achievement,
    stats: StatsContent,
    context: TransactionContext
  ): Promise<AchievementCheckResult> {
    try {
      const validatedAchievement = validateAchievement(achievement);
      const requirements = validatedAchievement.requirements;

      let totalProgress = 0;
      let requirementCount = requirements.length;

      for (const requirement of requirements) {
        totalProgress += await calculateProgress(requirement, stats);
      }

      const progress = totalProgress / requirementCount;
      const completed = progress >= 1;

      if (completed) {
        const notification: AchievementNotification = {
          achievement: validatedAchievement,
          pointsEarned: validatedAchievement.points,
        };

        return {
          completed,
          progress,
          notification
        };
      }

      return {
        completed,
        progress
      };
    } catch (error) {
      throw new GamificationError(
        'Failed to check achievement',
        'CHECK_ACHIEVEMENT_FAILED',
        500,
        error
      );
    }
  }
}
