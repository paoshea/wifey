import { PrismaClient, Achievement, UserProgress } from '@prisma/client';
import { validateAchievementRequirements, calculateProgress } from '../gamification/validation';
import { 
  StatsContent, 
  ValidatedLeaderboardEntry,
  ValidatedUserStats,
  ValidatedAchievement,
  AchievementTier,
  LeaderboardEntrySchema
} from '../gamification/types';

export class GamificationService {
  constructor(private prisma: PrismaClient) {}

  async updateUserStats(userId: string, newStats: Partial<StatsContent>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Update stats
    const currentStats = (userProgress.stats?.stats || {}) as StatsContent;
    const updatedStats = {
      ...currentStats,
      ...newStats
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
          unlockedAt: achievement.completed ? new Date() : null
        },
        update: {
          progress: achievement.progress || 0,
          completed: achievement.completed || false,
          unlockedAt: achievement.completed ? new Date() : null
        }
      });
    }

    return this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true, achievements: true }
    });
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
      validateAchievementRequirements(achievement, { stats })
    );
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
