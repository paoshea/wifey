import { PrismaClient, UserProgress, Achievement } from '@prisma/client';
import { validateAchievementRequirements, calculateProgress } from '../gamification/validation';
import { UserStats } from '../gamification/types';

export class GamificationService {
  constructor(private prisma: PrismaClient) {}

  async updateUserStats(userId: string, newStats: Partial<UserStats['stats']>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Update stats
    const stats = userProgress.stats?.stats || {};
    const updatedStats = {
      ...stats,
      ...newStats,
      lastMeasurementDate: new Date().toISOString()
    };

    // Update or create user stats
    await this.prisma.userStats.upsert({
      where: { userProgressId: userProgress.id },
      create: {
        userProgressId: userProgress.id,
        stats: updatedStats
      },
      update: {
        stats: updatedStats
      }
    });

    // Check achievements
    const achievements = await this.checkAchievements(userId, updatedStats);
    
    // Update achievements
    for (const achievement of achievements) {
      if (achievement.completed) continue;

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
          progress: achievement.progress || 0,
          target: achievement.target,
          completed: achievement.completed || false,
          unlockedAt: achievement.unlockedAt
        },
        update: {
          progress: achievement.progress || 0,
          completed: achievement.completed || false,
          unlockedAt: achievement.unlockedAt
        }
      });
    }

    return this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });
  }

  private async checkAchievements(userId: string, stats: UserStats['stats']): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany();
    
    return achievements.map(achievement => {
      const { requirements } = achievement;
      const isCompleted = validateAchievementRequirements(achievement, { stats });
      const progress = calculateProgress(achievement, { stats });

      return {
        ...achievement,
        progress: progress.current,
        completed: isCompleted,
        unlockedAt: isCompleted ? new Date() : null,
        earnedDate: isCompleted ? new Date().toISOString() : null
      };
    });
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { achievements: true }
    });

    if (!userProgress) {
      return this.prisma.achievement.findMany();
    }

    const achievements = await this.prisma.achievement.findMany();
    return achievements.map(achievement => {
      const userAchievement = userProgress.achievements.find(
        ua => ua.achievementId === achievement.id
      );

      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        completed: userAchievement?.completed || false,
        unlockedAt: userAchievement?.unlockedAt || null,
        earnedDate: userAchievement?.unlockedAt?.toISOString() || null
      };
    });
  }
}
