import { PrismaClient, User, UserStreak, Achievement } from '@prisma/client';
import { addDays, differenceInHours, isWithinInterval, startOfDay } from 'date-fns';
import { STREAK_ACHIEVEMENTS, STREAK_BONUSES } from '../constants/streak-achievements';

interface StreakUpdateResult {
  streak: UserStreak;
  pointsEarned: number;
  achievements: Achievement[];
  multiplier: number;
}

export class StreakService {
  constructor(private readonly prisma: PrismaClient) { }

  /**
   * Get or create a user's streak
   */
  async getOrCreateStreak(userId: string): Promise<UserStreak> {
    const existingStreak = await this.prisma.userStreak.findFirst({
      where: { userId },
      orderBy: { lastCheckin: 'desc' }
    });

    if (existingStreak) {
      return existingStreak;
    }

    return this.prisma.userStreak.create({
      data: {
        userId,
        current: 0,
        longest: 0,
        lastCheckin: new Date()
      }
    });
  }

  /**
   * Update user's streak based on their last check-in
   */
  async updateStreak(userId: string): Promise<StreakUpdateResult> {
    const now = new Date();
    const streak = await this.getOrCreateStreak(userId);
    const lastCheckin = streak.lastCheckin;

    // Get the start of today and yesterday
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(addDays(now, -1));

    // Check if last check-in was today
    if (isWithinInterval(lastCheckin, { start: todayStart, end: now })) {
      return {
        streak,
        pointsEarned: 0,
        achievements: [],
        multiplier: this.getCurrentMultiplier(streak.current)
      }; // Already checked in today
    }

    // Check if last check-in was yesterday
    const wasYesterday = isWithinInterval(lastCheckin, {
      start: yesterdayStart,
      end: todayStart
    });

    // Update streak
    const newCurrent = wasYesterday ? streak.current + 1 : 1;
    const newLongest = wasYesterday ? Math.max(streak.longest, newCurrent) : streak.longest;

    // Calculate points and multiplier
    const multiplier = this.getCurrentMultiplier(newCurrent);
    const pointsEarned = STREAK_BONUSES.DAILY_BONUS * multiplier;

    // Check for achievements
    const newAchievements = await this.checkAndGrantAchievements(userId, newCurrent);

    // Update the streak
    const updatedStreak = await this.prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        current: newCurrent,
        longest: newLongest,
        lastCheckin: now
      }
    });

    // Update user's total points in UserStats
    await this.prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        points: pointsEarned
      },
      update: {
        points: {
          increment: pointsEarned
        }
      }
    });

    return {
      streak: updatedStreak,
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
        const newAchievement = await this.prisma.achievement.create({
          data: {
            userId,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points,
            type: 'streak',
            icon: achievement.icon,
            requirements: JSON.stringify([{
              type: 'streak',
              metric: 'length',
              value: achievement.threshold,
              operator: 'gte',
              description: `Maintain a streak of ${achievement.threshold} days`
            }]),
            progress: streakLength,
            isCompleted: true,
            unlockedAt: new Date()
          }
        });

        // Add achievement points to UserStats
        await this.prisma.userStats.upsert({
          where: { userId },
          create: {
            userId,
            points: achievement.points
          },
          update: {
            points: {
              increment: achievement.points
            }
          }
        });

        newAchievements.push(newAchievement);
      }
    }

    return newAchievements;
  }

  /**
   * Reset a user's streak
   */
  async resetStreak(userId: string): Promise<UserStreak> {
    const streak = await this.getOrCreateStreak(userId);

    return this.prisma.userStreak.update({
      where: { id: streak.id },
      data: {
        current: 0,
        lastCheckin: new Date()
      }
    });
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
    const streak = await this.getOrCreateStreak(userId);
    const now = new Date();
    const todayStart = startOfDay(now);

    const canCheckInToday = !isWithinInterval(streak.lastCheckin, {
      start: todayStart,
      end: now
    });

    return {
      current: streak.current,
      longest: streak.longest,
      lastCheckin: streak.lastCheckin,
      canCheckInToday
    };
  }
}

// Export a singleton instance
const prisma = new PrismaClient();
export const streakService = new StreakService(prisma);
