import { PrismaClient, User } from '@prisma/client';
import { addDays, differenceInHours, isWithinInterval, startOfDay } from 'date-fns';
import { STREAK_ACHIEVEMENTS, STREAK_BONUSES } from '../constants/streak-achievements';
import { StatsContent } from '../gamification/types';
import { Achievement, adaptPrismaToAchievement } from './db/achievement-adapter';

interface StreakData {
  current: number;
  longest: number;
  lastCheckin: Date;
}

interface StreakUpdateResult {
  streak: StreakData;
  pointsEarned: number;
  achievements: Achievement[];
  multiplier: number;
}

export class StreakService {
  constructor(private readonly prisma: PrismaClient) { }

  /**
   * Get or create a user's streak data from UserStats
   */
  private async getOrCreateStreakData(userId: string): Promise<StreakData> {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      // Create new UserStats with default streak data
      await this.prisma.userStats.create({
        data: {
          userId,
          points: 0,
          stats: JSON.stringify({
            consecutiveDays: 0,
            totalMeasurements: 0,
            ruralMeasurements: 0,
            uniqueLocations: 0,
            totalDistance: 0,
            contributionScore: 0,
            qualityScore: 0,
            accuracyRate: 0,
            verifiedSpots: 0,
            helpfulActions: 0,
            lastCheckin: new Date()
          })
        }
      });

      return {
        current: 0,
        longest: 0,
        lastCheckin: new Date()
      };
    }

    const stats = JSON.parse(userStats.stats as string) as StatsContent & { lastCheckin?: string };
    return {
      current: stats.consecutiveDays,
      longest: stats.consecutiveDays, // Using consecutiveDays as both current and longest
      lastCheckin: stats.lastCheckin ? new Date(stats.lastCheckin) : new Date()
    };
  }

  /**
   * Update user's streak based on their last check-in
   */
  async updateStreak(userId: string): Promise<StreakUpdateResult> {
    const now = new Date();
    const streakData = await this.getOrCreateStreakData(userId);
    const lastCheckin = streakData.lastCheckin;

    // Get the start of today and yesterday
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(addDays(now, -1));

    // Check if last check-in was today
    if (isWithinInterval(lastCheckin, { start: todayStart, end: now })) {
      return {
        streak: streakData,
        pointsEarned: 0,
        achievements: [],
        multiplier: this.getCurrentMultiplier(streakData.current)
      }; // Already checked in today
    }

    // Check if last check-in was yesterday
    const wasYesterday = isWithinInterval(lastCheckin, {
      start: yesterdayStart,
      end: todayStart
    });

    // Update streak
    const newCurrent = wasYesterday ? streakData.current + 1 : 1;
    const newLongest = Math.max(streakData.longest, newCurrent);

    // Calculate points and multiplier
    const multiplier = this.getCurrentMultiplier(newCurrent);
    const pointsEarned = STREAK_BONUSES.DAILY_BONUS * multiplier;

    // Check for achievements
    const newAchievements = await this.checkAndGrantAchievements(userId, newCurrent);

    // Update the streak data in UserStats
    const updatedStats = await this.prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        points: pointsEarned,
        stats: JSON.stringify({
          consecutiveDays: newCurrent,
          totalMeasurements: 0,
          ruralMeasurements: 0,
          uniqueLocations: 0,
          totalDistance: 0,
          contributionScore: 0,
          qualityScore: 0,
          accuracyRate: 0,
          verifiedSpots: 0,
          helpfulActions: 0,
          lastCheckin: now
        })
      },
      update: {
        points: {
          increment: pointsEarned
        },
        stats: JSON.stringify({
          consecutiveDays: newCurrent,
          totalMeasurements: 0,
          ruralMeasurements: 0,
          uniqueLocations: 0,
          totalDistance: 0,
          contributionScore: 0,
          qualityScore: 0,
          accuracyRate: 0,
          verifiedSpots: 0,
          helpfulActions: 0,
          lastCheckin: now
        })
      }
    });

    const updatedStreakData: StreakData = {
      current: newCurrent,
      longest: newLongest,
      lastCheckin: now
    };

    return {
      streak: updatedStreakData,
      pointsEarned,
      achievements: newAchievements,
      multiplier
    };
  }

  /**
   * Calculate current point multiplier based on streak length
   */
  private getCurrentMultiplier(streakLength: number): number {
    const thresholds = Object.keys(STREAK_BONUSES.MULTIPLIERS)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (streakLength >= threshold) {
        return STREAK_BONUSES.MULTIPLIERS[threshold as keyof typeof STREAK_BONUSES.MULTIPLIERS];
      }
    }
    return 1;
  }

  /**
   * Check and grant streak-based achievements
   */
  private async checkAndGrantAchievements(userId: string, streakLength: number): Promise<Achievement[]> {
    const eligibleAchievements = STREAK_ACHIEVEMENTS.filter(
      achievement => achievement.threshold <= streakLength
    );

    const newAchievements: Achievement[] = [];

    for (const achievement of eligibleAchievements) {
      const existingAchievement = await this.prisma.achievement.findFirst({
        where: {
          userId,
          title: achievement.title,
          type: 'streak'
        }
      });

      if (!existingAchievement) {
        const prismaAchievement = await this.prisma.achievement.create({
          data: {
            userId,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points,
            type: 'streak',
            icon: achievement.icon,
            tier: 'COMMON',
            requirements: JSON.stringify([{
              type: 'streak',
              metric: 'length',
              value: achievement.threshold,
              operator: 'gte',
              description: `Maintain a streak of ${achievement.threshold} days`
            }]),
            progress: streakLength,
            target: achievement.threshold,
            completed: true,
            unlockedAt: new Date()
          }
        });

        // Add achievement points to UserStats
        await this.prisma.userStats.upsert({
          where: { userId },
          create: {
            userId,
            points: achievement.points,
            stats: JSON.stringify({
              consecutiveDays: streakLength,
              totalMeasurements: 0,
              ruralMeasurements: 0,
              uniqueLocations: 0,
              totalDistance: 0,
              contributionScore: 0,
              qualityScore: 0,
              accuracyRate: 0,
              verifiedSpots: 0,
              helpfulActions: 0
            })
          },
          update: {
            points: {
              increment: achievement.points
            }
          }
        });

        newAchievements.push(adaptPrismaToAchievement(prismaAchievement));
      }
    }

    return newAchievements;
  }

  /**
   * Reset a user's streak
   */
  async resetStreak(userId: string): Promise<StreakData> {
    await this.prisma.userStats.update({
      where: { userId },
      data: {
        stats: JSON.stringify({
          consecutiveDays: 0,
          totalMeasurements: 0,
          ruralMeasurements: 0,
          uniqueLocations: 0,
          totalDistance: 0,
          contributionScore: 0,
          qualityScore: 0,
          accuracyRate: 0,
          verifiedSpots: 0,
          helpfulActions: 0,
          lastCheckin: new Date()
        })
      }
    });

    return {
      current: 0,
      longest: 0,
      lastCheckin: new Date()
    };
  }

  /**
   * Get a user's current streak status
   */
  async getStreakStatus(userId: string): Promise<{
    current: number;
    longest: number;
    lastCheckin: Date;
    canCheckInToday: boolean;
  }> {
    const streakData = await this.getOrCreateStreakData(userId);
    const now = new Date();
    const todayStart = startOfDay(now);

    const canCheckInToday = !isWithinInterval(streakData.lastCheckin, {
      start: todayStart,
      end: now
    });

    return {
      current: streakData.current,
      longest: streakData.longest,
      lastCheckin: streakData.lastCheckin,
      canCheckInToday
    };
  }
}

// Export a singleton instance
const prisma = new PrismaClient();
export const streakService = new StreakService(prisma);
