import { z } from 'zod';
import {
  Achievement,
  Requirement,
  StatsContent,
  StatsMetric,
  RequirementType,
  RequirementOperator,
  ValidatedMeasurementInput,
  MeasurementInput,
  AchievementTier
} from '../types';

// Achievement validation
export function validateAchievement(achievement: Achievement) {
  const schema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    points: z.number().min(0),
    tier: z.nativeEnum(AchievementTier),
    requirements: z.array(z.object({
      type: z.nativeEnum(RequirementType),
      metric: z.nativeEnum(StatsMetric),
      value: z.number(),
      operator: z.nativeEnum(RequirementOperator),
      description: z.string().optional()
    })),
    target: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date()
  });

  return schema.safeParse(achievement);
}

// Stats validation
export function validateStatsContent(stats: StatsContent) {
  const schema = z.object({
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

  return schema.safeParse(stats);
}

// Requirement validation
export function validateRequirement(requirement: Requirement, stats: StatsContent): boolean {
  if (!(requirement.metric in stats)) {
    return false;
  }

  const value = stats[requirement.metric];
  switch (requirement.operator) {
    case RequirementOperator.EQUAL:
      return value === requirement.value;
    case RequirementOperator.NOT_EQUAL:
      return value !== requirement.value;
    case RequirementOperator.GREATER_THAN:
      return value > requirement.value;
    case RequirementOperator.LESS_THAN:
      return value < requirement.value;
    case RequirementOperator.GREATER_THAN_EQUAL:
      return value >= requirement.value;
    case RequirementOperator.LESS_THAN_EQUAL:
      return value <= requirement.value;
    default:
      return false;
  }
}

// Achievement requirements validation
export function validateAchievementRequirements(achievement: Achievement, context: { stats: StatsContent }) {
  const validatedStats = validateStatsContent(context.stats);
  if (!validatedStats.success) {
    return false;
  }

  const validatedAchievement = validateAchievement(achievement);
  if (!validatedAchievement.success) {
    return false;
  }

  const requirements = achievement.requirements as Requirement[];
  return requirements.every(req => validateRequirement(req, context.stats));
}

// Progress calculation
export function calculateProgress(achievement: Achievement, context: { stats: StatsContent }) {
  const requirements = achievement.requirements as Requirement[];
  const target = achievement.target || 100;
  const progress = requirements.reduce((acc, req) => {
    const value = context.stats[req.metric as keyof StatsContent];
    return acc + (value / req.value) * (target / requirements.length);
  }, 0);

  return {
    current: Math.min(progress, target),
    target
  };
}

// Level calculation
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Required XP calculation
export function calculateRequiredXP(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

// Measurement input validation
export function validateMeasurementInput(data: unknown): ValidatedMeasurementInput {
  const schema = z.object({
    isRural: z.boolean(),
    isFirstInArea: z.boolean(),
    quality: z.number().min(0).max(100),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error('Invalid measurement input');
  }

  return result.data;
}
