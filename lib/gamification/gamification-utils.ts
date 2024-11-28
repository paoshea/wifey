// lib/gamification/gamification-utils.ts

import {
  Achievement,
  AchievementProgress,
  AchievementTier,
  StatsContent,
  ValidatedAchievement,
  AchievementFilter,
  SortOption,
  ActivityData,
  FormattedActivityData,
  TierColors
} from './types';
import { ValidationError } from './errors';

const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 5000, 15000, 30000, 50000, 75000, 100000] as const;
const MAX_LEVEL = 10;

export function calculateLevel(points: number): number {
  if (typeof points !== 'number') {
    throw new ValidationError('Points must be a number');
  }

  if (points < 0) return 1;
  if (points >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) return MAX_LEVEL;

  const level = LEVEL_THRESHOLDS.findIndex(threshold => points < threshold);
  return level === -1 ? MAX_LEVEL : level;
}

export function calculateProgress(current: number, min: number, max: number): number {
  if (typeof current !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
    throw new ValidationError('Progress calculation requires numeric values');
  }

  if (max <= min) return 0;
  if (current >= max) return 1;
  if (current <= min) return 0;

  const progress = (current - min) / (max - min);
  return Math.max(0, Math.min(1, progress)); // Ensure result is between 0 and 1
}

export function getNextLevelThreshold(currentLevel: number): number | null {
  if (typeof currentLevel !== 'number') {
    throw new ValidationError('Current level must be a number');
  }

  if (currentLevel < 1) return LEVEL_THRESHOLDS[1];
  if (currentLevel >= MAX_LEVEL) return null;

  return LEVEL_THRESHOLDS[currentLevel];
}

export function formatActivityData(data: ActivityData[]): FormattedActivityData[] {
  if (!Array.isArray(data)) {
    throw new ValidationError('Activity data must be an array');
  }

  return data.map(item => {
    if (!item.date || typeof item.measurements !== 'number' || typeof item.rural !== 'number') {
      throw new ValidationError('Invalid activity data format');
    }

    return {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.measurements,
      ruralValue: item.rural
    };
  });
}

export function calculateAchievementProgress(achievement: AchievementProgress): number {
  if (!achievement || typeof achievement.progress !== 'number') {
    throw new ValidationError('Invalid achievement progress data');
  }

  const target = achievement.target ?? 100;
  if (target <= 0) return 0;

  const progress = achievement.progress / target;
  return Math.max(0, Math.min(1, progress)); // Ensure result is between 0 and 1
}

export function getRarityColor(tier: AchievementTier): string {
  const colors: Record<AchievementTier, string> = {
    [AchievementTier.COMMON]: 'gray',
    [AchievementTier.RARE]: 'blue',
    [AchievementTier.EPIC]: 'purple',
    [AchievementTier.LEGENDARY]: 'orange'
  };

  return colors[tier] || colors[AchievementTier.COMMON];
}

export function sortAchievements(
  achievements: AchievementProgress[],
  sortBy: SortOption = 'progress'
): AchievementProgress[] {
  if (!Array.isArray(achievements)) {
    throw new ValidationError('Achievements must be an array');
  }

  const tierOrder: Record<AchievementTier, number> = {
    [AchievementTier.LEGENDARY]: 0,
    [AchievementTier.EPIC]: 1,
    [AchievementTier.RARE]: 2,
    [AchievementTier.COMMON]: 3
  };

  return [...achievements].sort((a, b) => {
    switch (sortBy) {
      case 'tier':
        return (tierOrder[a.achievement?.tier ?? AchievementTier.COMMON] || 3) -
          (tierOrder[b.achievement?.tier ?? AchievementTier.COMMON] || 3);
      case 'progress':
        return calculateAchievementProgress(b) - calculateAchievementProgress(a);
      case 'date':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });
}

export function filterAchievements(
  achievements: AchievementProgress[],
  filters: AchievementFilter
): AchievementProgress[] {
  if (!Array.isArray(achievements)) {
    throw new ValidationError('Achievements must be an array');
  }

  return achievements.filter(achievement => {
    // Validate achievement structure
    if (!achievement || !achievement.achievement) {
      throw new ValidationError('Invalid achievement structure');
    }

    // Filter by completion status
    if (filters.completed !== undefined && achievement.isCompleted !== filters.completed) {
      return false;
    }

    // Filter by tier
    if (filters.tier && achievement.achievement?.tier !== filters.tier) {
      return false;
    }

    return true;
  });
}

// New utility functions for stats calculations

export function calculateTotalProgress(stats: StatsContent): number {
  if (!stats) {
    throw new ValidationError('Stats object is required');
  }

  const weights = {
    totalMeasurements: 0.3,
    ruralMeasurements: 0.2,
    verifiedSpots: 0.15,
    helpfulActions: 0.1,
    qualityScore: 0.15,
    accuracyRate: 0.1
  };

  let totalProgress = 0;
  let totalWeight = 0;

  for (const [metric, weight] of Object.entries(weights)) {
    if (metric in stats) {
      totalProgress += (stats[metric as keyof StatsContent] as number) * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalProgress / totalWeight : 0;
}

export function calculateContributionScore(stats: StatsContent): number {
  if (!stats) {
    throw new ValidationError('Stats object is required');
  }

  const {
    totalMeasurements,
    ruralMeasurements,
    verifiedSpots,
    helpfulActions,
    qualityScore,
    accuracyRate
  } = stats;

  // Base score from measurements
  let score = totalMeasurements * 10;

  // Bonus for rural measurements
  score += ruralMeasurements * 15;

  // Bonus for verified spots
  score += verifiedSpots * 20;

  // Bonus for helpful actions
  score += helpfulActions * 5;

  // Quality multiplier
  const qualityMultiplier = 1 + (qualityScore / 100);
  score *= qualityMultiplier;

  // Accuracy multiplier
  const accuracyMultiplier = 1 + (accuracyRate / 100);
  score *= accuracyMultiplier;

  return Math.floor(score);
}
