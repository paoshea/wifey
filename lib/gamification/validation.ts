import { z } from 'zod';
import { Achievement, UserStats } from '@prisma/client';
import { 
  BaseRequirement,
  BaseRequirementSchema,
  AchievementSchema,
  UserStatsSchema,
  RequirementType
} from './types';

// Achievement requirement validation
export function validateRequirement(requirement: unknown): BaseRequirement {
  return BaseRequirementSchema.parse(requirement);
}

// Achievement validation
export function validateAchievement(data: unknown): Achievement {
  return AchievementSchema.parse(data);
}

// User stats validation
export function validateUserStats(data: unknown): Record<string, any> {
  const result = UserStatsSchema.parse(data);
  return result.stats;
}

export function validateAchievementRequirements(
  achievement: Achievement,
  { stats }: { stats: Record<string, any> }
): boolean {
  try {
    const requirements = achievement.requirements as any[];
    if (!requirements?.length) return false;

    return requirements.every(requirement => {
      const { type, value, operator = 'gte', metric } = requirement;
      const statValue = stats[metric];

      if (typeof statValue !== 'number') return false;

      switch (operator) {
        case 'gt':
          return statValue > value;
        case 'gte':
          return statValue >= value;
        case 'lt':
          return statValue < value;
        case 'lte':
          return statValue <= value;
        case 'eq':
          return statValue === value;
        default:
          return false;
      }
    });
  } catch (error) {
    console.error('Error validating achievement requirements:', error);
    return false;
  }
}

export function calculateProgress(
  achievement: Achievement,
  { stats }: { stats: Record<string, any> }
): { current: number; target: number } {
  try {
    const requirements = achievement.requirements as any[];
    if (!requirements?.length) {
      return { current: 0, target: 0 };
    }

    // For now, we'll use the first requirement as the main progress indicator
    const requirement = requirements[0];
    const { value, metric } = requirement;
    const current = stats[metric] ?? 0;

    return {
      current: Math.min(current, value),
      target: value
    };
  } catch (error) {
    console.error('Error calculating achievement progress:', error);
    return { current: 0, target: 0 };
  }
}
