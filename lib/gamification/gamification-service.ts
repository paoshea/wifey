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
  StatsMetric
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
  constructor(private prisma: PrismaClient) {}

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
            include: { achievement: true }
          });
          return newUserAchievement;
        }

        return userAchievement;
      }));
    } catch (error) {
      if (error instanceof GamificationError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch achievements', error);
    }
  }

  async processMeasurement(userId: string, data: unknown): Promise<MeasurementResult> {
    const validatedInput = validateMeasurementInput(data);
    
    return await this.prisma.$transaction(async (tx) => {
      const context: TransactionContext = { tx, userId, now: new Date() };
      
      try {
        // Get or create user progress
        let userProgress = await tx.userProgress.findUnique({
          where: { userId },
          include: { stats: true }
        });

        if (!userProgress) {
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

          userProgress = await tx.userProgress.create({
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
              stats: {
                create: {
                  stats: initialStats as Prisma.JsonValue
                }
              }
            },
            include: { stats: true }
          });
        }

        // Calculate streak
        const lastActive = userProgress.lastActive;
        const daysSinceLastActive = Math.floor((context.now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const streak = daysSinceLastActive === 1 ? userProgress.streak + 1 : 1;

        // Calculate points and XP
        const { points, xp, bonuses } = calculateMeasurementPoints({
          ...validatedInput,
          streak
        });

        // Update stats
        const currentStats = validateStatsContent(userProgress.stats?.stats || {});
        const updatedStats: StatsContent = {
          ...currentStats,
          [StatsMetric.TOTAL_MEASUREMENTS]: currentStats[StatsMetric.TOTAL_MEASUREMENTS] + 1,
          [StatsMetric.RURAL_MEASUREMENTS]: validatedInput.isRural ? 
            currentStats[StatsMetric.RURAL_MEASUREMENTS] + 1 : 
            currentStats[StatsMetric.RURAL_MEASUREMENTS],
          [StatsMetric.QUALITY_SCORE]: validatedInput.quality,
          [StatsMetric.CONSECUTIVE_DAYS]: streak
        };

        await tx.userStats.upsert({
          where: { userProgressId: userProgress.id },
          create: {
            userProgress: { connect: { id: userProgress.id } },
            stats: updatedStats as Prisma.JsonValue
          },
          update: { 
            stats: updatedStats as Prisma.JsonValue
          }
        });

        // Update user progress
        const totalXP = userProgress.totalXP + xp;
        const { level, currentXP, nextLevelXP } = calculateLevel(totalXP);
        const newLevel = level > userProgress.level ? level : undefined;
        
        await tx.userProgress.update({
          where: { id: userProgress.id },
          data: {
            totalPoints: userProgress.totalPoints + points,
            level,
            currentXP,
            totalXP,
            nextLevelXP,
            streak,
            lastActive: context.now
          }
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
      } catch (error) {
        if (error instanceof GamificationError) {
          throw error;
        }
        throw new TransactionError('Failed to process measurement', error);
      }
    });
  }

  private async checkAchievement(
    achievement: Achievement,
    stats: StatsContent,
    context: TransactionContext
  ): Promise<AchievementCheckResult> {
    try {
      const userAchievement = await context.tx.userAchievement.findUnique({
        where: {
          userProgressId_achievementId: {
            userProgressId: context.userId,
            achievementId: achievement.id
          }
        }
      });

      if (userAchievement?.completed) {
        return { completed: true, progress: 100 };
      }

      const requirements = achievement.requirements as Requirement[];
      const allRequirementsMet = requirements.every(req => 
        checkRequirementMet(req, stats, context)
      );

      if (allRequirementsMet) {
        const updatedAchievement = await context.tx.userAchievement.upsert({
          where: {
            userProgressId_achievementId: {
              userProgressId: context.userId,
              achievementId: achievement.id
            }
          },
          create: {
            userProgressId: context.userId,
            achievementId: achievement.id,
            progress: achievement.target || 100,
            target: achievement.target,
            completed: true,
            unlockedAt: context.now
          },
          update: {
            progress: achievement.target || 100,
            completed: true,
            unlockedAt: context.now
          }
        });

        // Update user progress
        await context.tx.userProgress.update({
          where: { userId: context.userId },
          data: {
            unlockedAchievements: { increment: 1 },
            lastAchievementAt: context.now,
            totalPoints: { increment: achievement.points }
          }
        });

        return {
          completed: true,
          progress: 100,
          notification: {
            achievement,
            pointsEarned: achievement.points
          }
        };
      }

      // Calculate and update progress
      const overallProgress = Math.floor(
        requirements.reduce((sum, req) => sum + calculateProgress(req, stats), 0) / requirements.length
      );

      if (userAchievement) {
        await context.tx.userAchievement.update({
          where: {
            userProgressId_achievementId: {
              userProgressId: context.userId,
              achievementId: achievement.id
            }
          },
          data: { progress: overallProgress }
        });
      } else {
        await context.tx.userAchievement.create({
          data: {
            userProgressId: context.userId,
            achievementId: achievement.id,
            progress: overallProgress,
            target: achievement.target
          }
        });
      }

      return { completed: false, progress: overallProgress };
    } catch (error) {
      if (error instanceof GamificationError) {
        throw error;
      }
      throw new DatabaseError('Failed to check achievement', error);
    }
  }
}
