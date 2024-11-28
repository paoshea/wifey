// lib/gamification/validation/index.ts 

import { z } from 'zod';
import {
  Achievement,
  Requirement,
  StatsContent,
  StatsMetric,
  RequirementType,
  RequirementOperator,
  ValidatedMeasurementInput,
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
      description: z.string()
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
export function validateRequirement(requirement: { metric: StatsMetric; operator: RequirementOperator; value: number }, stats: StatsContent | null): boolean {
  if (!stats) return false;

  const value = stats[requirement.metric];
  if (typeof value !== 'number') return false;

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

// Achievement requirements validation
export function validateAchievementRequirements(achievement: Achievement, context: { stats: StatsContent | null }) {
  if (!achievement.requirements || !Array.isArray(achievement.requirements)) {
    return false;
  }

  return achievement.requirements.every(req => validateRequirement(req, context.stats));
}

// Progress calculation
export function calculateProgress(achievement: Achievement, context: { stats: StatsContent | null }) {
  if (!achievement.requirements || !Array.isArray(achievement.requirements)) {
    return 0;
  }

  const metRequirements = achievement.requirements.filter(req => validateRequirement(req, context.stats));
  return (metRequirements.length / achievement.requirements.length) * 100;
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
    }),
    device: z.object({
      type: z.string(),
      model: z.string(),
      os: z.string()
    }).optional()
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Invalid measurement input: ${fieldErrors}`);
  }

  return result.data;
}
