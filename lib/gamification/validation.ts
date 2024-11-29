// lib/gamification/validation.ts

import { z } from 'zod';
import { type Measurement } from '@prisma/client';
import {
  type StatsMetric,
  type StatsContent,
  type ValidatedMeasurementInput,
  type ValidatedAchievement,
  type ValidatedUserProgress,
  type ValidatedUserStats,
  type Requirement,
  AchievementSchema,
  UserStatsSchema,
  StatsContentSchema,
  UserProgressSchema,
  RequirementSchema,
  MeasurementInputSchema
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

// Requirement validation
export function validateRequirement(requirement: Requirement, stats: StatsContent): boolean {
  try {
    const parsed = RequirementSchema.parse(requirement);
    return checkRequirementMet(parsed, getStatValue(parsed.metric, stats));
  } catch (error) {
    throw new ValidationError('Invalid requirement data', error);
  }
}

// Helper function to get stat value safely
export function getStatValue(metric: string, stats: StatsContent): number {
  return stats[metric as keyof StatsContent] ?? 0;
}

// Achievement requirements validation
export function validateAchievementRequirements(
  requirements: Requirement[],
  stats: StatsContent
): { isValid: boolean; data: Requirement[]; progress: number } {
  try {
    const validatedReqs = requirements.map(req => ({
      requirement: RequirementSchema.parse(req),
      isMet: validateRequirement(req, stats)
    }));
    
    const progress = validatedReqs.filter(r => r.isMet).length / validatedReqs.length;
    return {
      isValid: progress === 1,
      data: validatedReqs.map(r => r.requirement),
      progress
    };
  } catch (error) {
    throw new ValidationError('Invalid achievement requirements', error);
  }
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

  // Add bonus points for rural measurements
  if (measurement.isRural) {
    points += 5;
  }

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

// Helper function to check if requirement is met
function checkRequirementMet(requirement: Requirement, value: number): boolean {
  switch (requirement.operator) {
    case 'GREATER_THAN':
      return value > requirement.value;
    case 'GREATER_THAN_EQUAL':
      return value >= requirement.value;
    case 'LESS_THAN':
      return value < requirement.value;
    case 'LESS_THAN_EQUAL':
      return value <= requirement.value;
    case 'EQUAL':
      return value === requirement.value;
    case 'NOT_EQUAL':
      return value !== requirement.value;
    default:
      return false;
  }
}
