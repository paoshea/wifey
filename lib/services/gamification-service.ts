// components/gamification/gamification-service.ts

import { PrismaClient, Achievement, UserProgress } from '@prisma/client';
import { calculateProgress, validateAchievement, checkRequirementMet } from '../gamification/validation';
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
  ValidatedUserProgress
} from '../gamification/types';

export class GamificationService {
  static async getUserProgress(userId: string): Promise<ValidatedUserProgress | null> {
    throw new Error('Method not implemented.');
  }

  constructor(private prisma: PrismaClient) { }

  async updateUserStats(userId: string, newStats: Partial<StatsContent>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Update stats
    const currentStats: StatsContent = userProgress.stats?.stats as StatsContent || {};
    const updatedStats = StatsContentSchema.parse({
      ...currentStats,
      ...newStats
    } as StatsContent);

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
      const validatedAchievement = validateAchievement(achievement);
      await this.prisma.userAchievement.upsert({
        where: {
          userProgressId_achievementId: {
            userProgressId: userProgress.id,
            achievementId: validatedAchievement.id
          }
        },
        create: {
          userProgressId: userProgress.id,
          achievementId: validatedAchievement.id,
          progress: calculateProgress(validatedAchievement.requirements, updatedStats),
          completed: false
        },
        update: {
          progress: calculateProgress(validatedAchievement.requirements, updatedStats)
        }
      });
    }

    return userProgress;
  }

  async updateLeaderboardEntry(userId: string, data: { points: number; timeframe: string }): Promise<ValidatedLeaderboardEntry> {
    const entry = await this.prisma.leaderboardEntry.upsert({
      where: {
        userId_timeframe: {
          userId,
          timeframe: data.timeframe
        }
      },
      create: {
        userId,
        points: data.points,
        rank: await this.calculateRank(data.points, data.timeframe),
        timeframe: data.timeframe
      },
      update: {
        points: data.points,
        rank: await this.calculateRank(data.points, data.timeframe)
      }
    });

    // Validate the entry using the schema
    return LeaderboardEntrySchema.parse(entry);
  }

  private async calculateRank(points: number, timeframe: string): Promise<number> {
    const higherScores = await this.prisma.leaderboardEntry.count({
      where: {
        timeframe,
        points: { gt: points }
      }
    });
    return higherScores + 1;
  }

  private async checkAchievements(userId: string, stats: StatsContent): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany({
      where: {
        userAchievements: {
          none: {
            userProgress: {
              userId
            },
            completed: true
          }
        }
      }
    });

    return achievements.filter(achievement =>
      checkRequirementMet(achievement.requirements, stats)
    );
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: {
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
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
        unlockedAt: userAchievement?.unlockedAt || null
      };
    });
  }

  async getCachedUserProgress(userId: string): Promise<ValidatedUserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: {
        stats: true,
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    return UserProgressSchema.parse(userProgress);
  }
}

const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);

export const getCachedUserProgress = (userId: string) => gamificationService.getCachedUserProgress(userId);
export { GamificationService };
