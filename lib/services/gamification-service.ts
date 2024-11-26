import { PrismaClient } from '@prisma/client';
import { Achievement, UserAchievement, AchievementProgress } from '@/lib/gamification/types';
import { validateAchievementRequirements } from '@/lib/gamification/validation';
import { calculateProgress } from '@/lib/gamification/gamification-utils';
import { prisma } from '@/lib/db';

class GamificationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany({
      include: {
        userAchievements: {
          where: {
            userProgress: {
              userId
            }
          }
        }
      }
    });

    return achievements.map(achievement => ({
      ...achievement,
      requirements: achievement.requirements as any[],
      unlockedAt: achievement.userAchievements[0]?.unlockedAt || null,
      progress: achievement.userAchievements[0]?.progress || 0
    }));
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: {
        userProgress: {
          userId
        }
      },
      include: {
        achievement: true
      }
    });

    return userAchievements;
  }

  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const achievements = await this.getAchievements(userId);
    const userStats = await this.prisma.userStats.findFirst({
      where: {
        userProgress: {
          userId
        }
      }
    });

    if (!userStats) {
      throw new Error('User stats not found');
    }

    return achievements.map(achievement => {
      const progress = calculateProgress(achievement, userStats);
      return {
        achievement,
        progress: progress.current,
        target: progress.target,
        isUnlocked: achievement.unlockedAt !== null,
        unlockedAt: achievement.unlockedAt
      };
    });
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const progressList = await this.getAchievementProgress(userId);
    const unlockedAchievements: Achievement[] = [];

    for (const { achievement, progress, target } of progressList) {
      if (!achievement.unlockedAt && progress >= target) {
        const userProgress = await this.prisma.userProgress.findFirst({
          where: { userId }
        });

        if (!userProgress) continue;

        await this.prisma.userAchievement.upsert({
          where: {
            userProgressId_achievementId: {
              userProgressId: userProgress.id,
              achievementId: achievement.id
            }
          },
          create: {
            userProgressId: userProgress.id,
            achievementId: achievement.id,
            progress,
            target,
            unlockedAt: new Date()
          },
          update: {
            progress,
            unlockedAt: new Date()
          }
        });

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }
}

export const gamificationService = new GamificationService();
