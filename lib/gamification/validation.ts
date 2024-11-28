// lib/gamification/validation/validation.ts

import {
  AchievementSchema,
  UserStatsSchema,
  StatsContentSchema,
  UserProgressSchema,
  StatsMetric,
  RequirementType,
  RequirementOperator,
  Requirement,
  ValidatedAchievement,
  StatsContent,
  MeasurementInputSchema,
  ValidatedMeasurementInput,
  ValidatedUserProgress,
  ValidatedUserStats,
  RequirementSchema
} from './types';
import { ValidationError } from './errors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Basic validation schemas
export const userIdSchema = z.string().min(1);
export const achievementIdSchema = z.string().min(1);

// Achievement validation
export function validateAchievement(data: unknown): ValidatedAchievement {
  try {
    const validatedData = AchievementSchema.parse(data);
    return {
      ...validatedData,
      progress: 0,
      target: 100, // Default target value
      requirements: validatedData.requirements.map(req => ({
        type: req.type,
        value: req.value,
        description: req.description,
        metric: req.metric,
        operator: req.operator
      }))
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid achievement data', error.errors);
    }
    throw error;
  }
}

// Stats validation
export function validateStats(data: unknown): StatsContent {
  try {
    return StatsContentSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid stats data', error.errors);
    }
    throw error;
  }
}

// User Progress validation
export function validateUserProgress(data: unknown): ValidatedUserProgress {
  try {
    return UserProgressSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user progress data', error.errors);
    }
    throw error;
  }
}

// User Stats validation
export function validateUserStats(data: unknown): ValidatedUserStats {
  try {
    return UserStatsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user stats data', error.errors);
    }
    throw error;
  }
}

// Requirement validation
export function validateRequirement(requirement: Requirement, stats: StatsContent): boolean {
  try {
    const value = getStatValue(requirement.metric, stats);
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
  } catch (error) {
    return false;
  }
}

// Helper function to get stat value safely
function getStatValue(metric: string, stats: StatsContent): number {
  // Convert metric string to a valid StatsContent key
  const metricMap: Record<string, keyof StatsContent> = {
    [StatsMetric.TOTAL_MEASUREMENTS]: 'totalMeasurements',
    [StatsMetric.RURAL_MEASUREMENTS]: 'ruralMeasurements',
    [StatsMetric.UNIQUE_LOCATIONS]: 'uniqueLocations',
    [StatsMetric.TOTAL_DISTANCE]: 'totalDistance',
    [StatsMetric.CONTRIBUTION_SCORE]: 'contributionScore',
    'qualityScore': 'qualityScore',
    'accuracyRate': 'accuracyRate',
    'verifiedSpots': 'verifiedSpots',
    'helpfulActions': 'helpfulActions',
    'consecutiveDays': 'consecutiveDays'
  };

  const key = metricMap[metric];
  return key ? (stats[key] ?? 0) : 0;
}

// Achievement requirements validation
export function validateAchievementRequirements(
  requirements: Requirement[],
  stats: StatsContent
): { isValid: boolean; data: Requirement[]; progress: number } {
  const validRequirements = requirements.filter(req => validateRequirement(req, stats));
  const progress = requirements.length > 0
    ? (validRequirements.length / requirements.length) * 100
    : 0;

  return {
    isValid: progress >= 100,
    data: requirements,
    progress
  };
}

// Measurement validation
export const measurementSchema = z.object({
  isRural: z.boolean(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  quality: z.number().min(0).max(100),
  device: z.object({
    type: z.string(),
    model: z.string(),
    os: z.string()
  })
});

export function validateMeasurement(data: unknown) {
  try {
    return measurementSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid measurement data', error.errors);
    }
    throw error;
  }
}

// Error handling
export function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Validation error', error.errors);
  }
  throw error;
}
