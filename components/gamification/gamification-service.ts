import { PrismaClient } from '@prisma/client';
import { 
  Achievement, 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric,
  ValidatedAchievement,
  LeaderboardTimeframe,
  StatsContent,
  UserProgress,
  LeaderboardEntry
} from './types';
import { validateAchievementRequirements } from './validation/achievement-validation';
import { validateRequirement } from './validation/requirement-validation';
import { z } from 'zod';

export class GamificationService {
  constructor(private readonly prisma: PrismaClient) {}

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

    const achievements = await this.prisma.achievement.findMany({
      include: { requirements: true }
    });

    return achievements.map(achievement => {
      const userAchievement = userProgress.achievements.find(
        ua => ua.achievementId === achievement.id
      );

      // Validate requirements
      const validatedRequirements = validateAchievementRequirements(
        achievement.requirements,
        userProgress.stats.stats as StatsContent
      );

      if (!validatedRequirements.success) {
        throw new Error(`Invalid requirements for achievement ${achievement.id}`);
      }

      return {
        ...achievement,
        progress: userAchievement?.progress ?? 0,
        requirements: validatedRequirements.data
      };
    });
  }

  async updateProgress(
    userId: string, 
    stats: Partial<StatsContent>
  ): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const currentStats = userProgress.stats?.stats as StatsContent ?? {};
    const updatedStats = { ...currentStats, ...stats };

    // Validate stats
    const statsSchema = z.object({
      [StatsMetric.TOTAL_MEASUREMENTS]: z.number().min(0),
      [StatsMetric.RURAL_MEASUREMENTS]: z.number().min(0),
      [StatsMetric.VERIFIED_SPOTS]: z.number().min(0),
      [StatsMetric.HELPFUL_ACTIONS]: z.number().min(0),
      [StatsMetric.CONSECUTIVE_DAYS]: z.number().min(0),
      [StatsMetric.QUALITY_SCORE]: z.number().min(0).max(100),
      [StatsMetric.ACCURACY_RATE]: z.number().min(0).max(100),
      [StatsMetric.UNIQUE_LOCATIONS]: z.number().min(0),
      [StatsMetric.TOTAL_DISTANCE]: z.number().min(0),
      [StatsMetric.CONTRIBUTION_SCORE]: z.number().min(0)
    });

    const validationResult = statsSchema.safeParse(updatedStats);
    if (!validationResult.success) {
      throw new Error('Invalid stats update');
    }

    return this.prisma.userProgress.update({
      where: { userId },
      data: {
        stats: {
          upsert: {
            create: { stats: updatedStats },
            update: { stats: updatedStats }
          }
        }
      },
      include: { stats: true }
    });
  }

  async getLeaderboard(
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.prisma.userProgress.findMany({
      orderBy: { points: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true
          }
        },
        achievements: {
          include: { achievement: true },
          orderBy: { progress: 'desc' },
          take: 3
        }
      }
    });

    if (!leaderboard) {
      return [];
    }

    return leaderboard.map((entry, index) => ({
      userId: entry.userId,
      username: entry.user?.username ?? 'Unknown User',
      points: entry.points,
      level: entry.level,
      rank: index + 1,
      topAchievements: entry.achievements.map(ua => ({
        ...ua.achievement,
        progress: ua.progress
      })),
      avatarUrl: entry.user?.avatarUrl ?? null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }));
  }
}
