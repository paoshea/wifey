// lib/gamification/validation.ts

import { z } from 'zod';
import { type Measurement } from '@prisma/client';
import {
  type StatsMetric,
  type StatsContent,
  type ValidatedMeasurementInput,
  type ValidatedAchievement,
  type ValidatedRequirement,
  type Achievement,
  type ValidatedUserProgress,
  type ValidatedUserStats,
  type Requirement,
  AchievementSchema,
  UserStatsSchema,
  StatsContentSchema,
  UserProgressSchema,
  RequirementSchema,
  MeasurementInputSchema,
  RequirementOperator
} from './types';
import { ValidationError } from './errors';

// Basic validation schemas
export const userIdSchema = z.string().min(1);
export const achievementIdSchema = z.string().min(1);

// Achievement validation
export function validateAchievement(data: unknown): ValidatedAchievement {
  try {
    return AchievementSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid achievement data', error);
  }
}

// Stats validation
export function validateStatsContent(data: unknown): StatsContent {
  try {
    return StatsContentSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid stats content', error);
  }
}

// User Progress validation
export function validateUserProgress(data: unknown): ValidatedUserProgress {
  try {
    return UserProgressSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid user progress data', error);
  }
}

// User Stats validation
export function validateUserStats(data: unknown): ValidatedUserStats {
  try {
    return UserStatsSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid user stats data', error);
  }
}

// Achievement requirements validation
export function validateRequirement(
  requirement: ValidatedRequirement,
  stats: StatsContent
): boolean {
  const statValue = stats[requirement.metric] || 0;

  switch (requirement.operator) {
    case RequirementOperator.GREATER_THAN:
      return statValue > requirement.value;
    case RequirementOperator.GREATER_THAN_EQUAL:
      return statValue >= requirement.value;
    case RequirementOperator.LESS_THAN:
      return statValue < requirement.value;
    case RequirementOperator.LESS_THAN_EQUAL:
      return statValue <= requirement.value;
    case RequirementOperator.EQUAL:
      return statValue === requirement.value;
    case RequirementOperator.NOT_EQUAL:
      return statValue !== requirement.value;
    default:
      return false;
  }
}

export function calculateProgress(
  achievement: Achievement,
  stats: StatsContent
): number {
  if (!achievement.requirements || !Array.isArray(achievement.requirements)) {
    return 0;
  }

  const validRequirements = achievement.requirements.filter(req => {
    if (typeof req !== 'object' || req === null) return false;
    const requirement = req as ValidatedRequirement;
    return validateRequirement(requirement, stats);
  });

  return Math.round((validRequirements.length / achievement.requirements.length) * 100);
}

// Measurement validation
export function validateMeasurement(data: unknown): ValidatedMeasurementInput {
  try {
    return MeasurementInputSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid measurement data', error);
  }
}

// Points calculation for measurement
export function calculatePointsForMeasurement(measurement: Measurement): number {
  let points = 10; // Base points

  // Add bonus points for accuracy if available
  if (measurement.accuracy && measurement.accuracy < 10) {
    points += 3;
  }

  // Add bonus points for additional data
  if (measurement.altitude) points += 1;
  if (measurement.speed) points += 1;

  return points;
}

// Level calculations
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function calculateRequiredXP(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

// Error handling
export function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Validation failed', error);
  }
  throw error;
}
