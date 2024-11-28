// components/gamification/gamification-service.ts

import { PrismaClient } from '@prisma/client';
import {
  Achievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  ValidatedAchievement,
  ValidatedRequirement,
  LeaderboardTimeframe,
  StatsContent,
  UserProgress,
  Requirement
} from '../../lib/gamification/types';
import { validateAchievementRequirements } from './validation/achievement-validation';
import { validateRequirement } from './validation/requirement-validation';
import { z } from 'zod';

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  image: string | null;
  points: number;
  achievements: Achievement[];
}

export class GamificationService {
  constructor(private readonly prisma: PrismaClient) { }

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

    const achievements = await this.prisma.achievement.findMany();

    return achievements.map(achievement => {
      const userAchievement = userProgress.achievements.find(
        ua => ua.achievementId === achievement.id
      );

      // Ensure requirements is an array and map each requirement
      const requirements = Array.isArray(achievement.requirements) 
        ? achievement.requirements.map(req => {
            if (!req) return null;
            try {
              const currentValue = this.getStatValue(req.metric, userProgress.stats!.stats as StatsContent);
              const isMet = this.checkRequirementMet(req, currentValue);
              
              return {
                type: req.type as RequirementType,
                value: req.value as number,
                description: req.description as string,
                metric: req.metric as string,
                operator: req.operator as RequirementOperator,
                currentValue,
                isMet
              } as ValidatedRequirement;
            } catch {
              return null;
            }
          }).filter((req): req is ValidatedRequirement => req !== null)
        : [];

      // Validate requirements
      const validatedReqs = validateAchievementRequirements(requirements, userProgress.stats!.stats as StatsContent);
      
      const validatedAchievement: ValidatedAchievement = {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        tier: achievement.tier as AchievementTier,
        rarity: achievement.tier as AchievementTier,
        requirements: validatedReqs.data,
        target: achievement.target ?? 0,
        progress: validatedReqs.progress,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt
      };

      return validatedAchievement;
    });
  }

  private getStatValue(metric: string, stats: StatsContent): number {
    const metricKey = metric as keyof StatsContent;
    return stats[metricKey] ?? 0;
  }

  private checkRequirementMet(requirement: Requirement, value: number): boolean {
    switch (requirement.operator) {
      case RequirementOperator.GREATER_THAN:
        return value > requirement.value;
      case RequirementOperator.GREATER_THAN_EQUAL:
        return value >= requirement.value;
      case RequirementOperator.LESS_THAN:
        return value < requirement.value;
      case RequirementOperator.LESS_THAN_EQUAL:
        return value <= requirement.value;
      case RequirementOperator.EQUAL:
        return value === requirement.value;
      case RequirementOperator.NOT_EQUAL:
        return value !== requirement.value;
      default:
        return false;
    }
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
      orderBy: { totalPoints: 'desc' },
      take: 100,
      include: {
        user: true,
        achievements: {
          include: { achievement: true },
          orderBy: { progress: 'desc' },
          take: 3
        }
      }
    });

    return leaderboard.map(entry => ({
      userId: entry.userId,
      name: entry.user?.name ?? null,
      image: entry.user?.image ?? null,
      points: entry.totalPoints,
      achievements: entry.achievements.map(a => a.achievement)
    }));
  }
}
