import { 
  Achievement, 
  UserProgress, 
  ContributionReward,
  LeaderboardEntry,
  AchievementRequirementType 
} from './types';
import { 
  ACHIEVEMENTS, 
  RURAL_BONUS_MULTIPLIER, 
  FIRST_IN_AREA_BONUS,
  QUALITY_BONUS_MAX,
  calculateLevel,
  getNextLevelThreshold,
  calculateAchievementProgress
} from './achievements';
import { PrismaClient, UserProgress as PrismaUserProgress, Achievement as PrismaAchievement, UserStats } from '@prisma/client';
import { validateAchievementRequirements, calculateProgress } from './validation';

export class GamificationService {
  private userProgress: Map<string, UserProgress> = new Map();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    // Initialize with empty user progress
  }

  private async getUserProgress(userId: string): Promise<UserProgress | null> {
    // TODO: Implement database fetch
    return this.userProgress.get(userId) || null;
  }

  private async updateUserProgress(userId: string, progress: UserProgress): Promise<void> {
    // TODO: Implement database update
    this.userProgress.set(userId, progress);
  }

  public async processMeasurement(userId: string, measurement: { 
    isRural: boolean;
    isFirstInArea: boolean;
    quality: number;
  }): Promise<ContributionReward> {
    const { isRural, isFirstInArea, quality } = measurement;
    let userProgress = await this.getUserProgress(userId) || {
      totalPoints: 0,
      level: 1,
      achievements: [],
      stats: {
        totalMeasurements: 0,
        ruralMeasurements: 0,
        verifiedSpots: 0,
        helpfulActions: 0,
        consecutiveDays: 0,
        lastMeasurementDate: new Date().toISOString()
      }
    };

    // Calculate base points and bonuses
    let points = 10; // Base points for measurement
    const bonuses: ContributionReward['bonuses'] = {};

    if (isRural) {
      const ruralBonus = Math.round(points * RURAL_BONUS_MULTIPLIER);
      points += ruralBonus;
      bonuses.ruralArea = ruralBonus;
      userProgress.stats.ruralMeasurements++;
    }

    if (isFirstInArea) {
      points += FIRST_IN_AREA_BONUS;
      bonuses.firstInArea = FIRST_IN_AREA_BONUS;
    }

    // Quality bonus (0-10 points based on quality score)
    const qualityBonus = Math.round(quality * QUALITY_BONUS_MAX);
    points += qualityBonus;
    bonuses.qualityBonus = qualityBonus;

    // Update user progress
    const today = new Date();
    const lastMeasurementDate = new Date(userProgress.stats.lastMeasurementDate);
    const daysSinceLastMeasurement = Math.floor((today.getTime() - lastMeasurementDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastMeasurement === 1) {
      userProgress.stats.consecutiveDays++;
      const streakBonus = Math.min(userProgress.stats.consecutiveDays, 7);
      points += streakBonus;
      bonuses.consistencyStreak = streakBonus;
    } else if (daysSinceLastMeasurement > 1) {
      userProgress.stats.consecutiveDays = 1;
    }

    userProgress.stats.totalMeasurements++;
    userProgress.stats.lastMeasurementDate = today.toISOString();
    userProgress.totalPoints += points;

    // Check for new achievements
    const newAchievements = await this.checkAchievements(userId, userProgress.stats);
    for (const achievement of newAchievements) {
      userProgress.achievements.push(achievement.id);
      userProgress.totalPoints += achievement.points;
    }

    // Check for level up
    const newLevel = calculateLevel(userProgress.totalPoints);
    const levelUp = newLevel > userProgress.level ? {
      newLevel,
      rewards: this.getLevelRewards(newLevel)
    } : undefined;
    userProgress.level = newLevel;

    await this.updateUserProgress(userId, userProgress);

    return {
      points,
      bonuses,
      achievements: newAchievements,
      levelUp
    };
  }

  private async checkAchievements(userId: string, stats: UserProgress['stats']): Promise<Achievement[]> {
    const earnedAchievements: Achievement[] = [];
    const userAchievements = await this.getUserAchievements(userId);

    for (const achievement of userAchievements) {
      if (achievement.completed) continue;

      const { type, count } = achievement.requirements;
      let currentProgress = 0;

      switch (type) {
        case 'measurements':
          currentProgress = stats.totalMeasurements;
          break;
        case 'rural_measurements':
          currentProgress = stats.ruralMeasurements;
          break;
        case 'verified_spots':
          currentProgress = stats.verifiedSpots;
          break;
        case 'helping_others':
          currentProgress = stats.helpfulActions;
          break;
        case 'consistency':
          currentProgress = stats.consecutiveDays;
          break;
      }

      achievement.progress = currentProgress;
      if (currentProgress >= count && !achievement.completed) {
        achievement.completed = true;
        achievement.earnedDate = new Date().toISOString();
        earnedAchievements.push(achievement);
      }
    }

    return earnedAchievements;
  }

  public async getUserAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return [...ACHIEVEMENTS]; // Return copy of base achievements for new users
    }

    // Merge base achievements with user progress
    return ACHIEVEMENTS.map(achievement => {
      const userAchievement = { ...achievement };
      if (progress.achievements.includes(achievement.id)) {
        userAchievement.completed = true;
      }
      return userAchievement;
    });
  }

  public async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime'): Promise<LeaderboardEntry[]> {
    // TODO: Implement proper leaderboard with timeframe filtering
    const entries: LeaderboardEntry[] = [];
    for (const [userId, progress] of this.userProgress.entries()) {
      entries.push({
        userId,
        username: `User ${userId}`,
        points: progress.totalPoints,
        rank: 0 // Will be calculated after sorting
      });
    }
    
    // Sort by points and assign ranks
    return entries
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  private getLevelRewards(level: number): string[] {
    const rewards: string[] = [];
    
    // Add level-specific rewards
    if (level % 5 === 0) {
      rewards.push('special_badge');
    }
    if (level % 10 === 0) {
      rewards.push('premium_feature');
    }
    
    return rewards;
  }

  async updateUserStats(userId: string, newStats: Partial<UserStats['stats']>): Promise<UserProgress> {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { stats: true }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    // Update stats
    const currentStats = userProgress.stats?.stats as Record<string, any> || {};
    const updatedStats = {
      ...currentStats,
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
      include: { stats: true }
    });
  }

  private async checkAchievements(userId: string, stats: Record<string, any>): Promise<PrismaAchievement[]> {
    const achievements = await this.prisma.achievement.findMany();
    
    return achievements.map(achievement => {
      const requirements = achievement.requirements as any[];
      const isCompleted = validateAchievementRequirements(achievement as any, { stats });
      const progress = calculateProgress(achievement as any, { stats });

      return {
        ...achievement,
        progress: progress.current,
        completed: isCompleted,
        unlockedAt: isCompleted ? new Date() : null,
        earnedDate: isCompleted ? new Date().toISOString() : null
      };
    });
  }

  async getAchievements(userId: string): Promise<PrismaAchievement[]> {
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
