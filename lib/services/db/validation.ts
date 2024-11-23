import { z } from 'zod';

// Base schemas
export const userIdSchema = z.string().min(1);
export const achievementIdSchema = z.string().min(1);
export const timeframeSchema = z.enum(['daily', 'weekly', 'monthly', 'allTime']);

// Complex schemas
export const userProgressSchema = z.object({
  level: z.number().int().min(1),
  currentXP: z.number().int().min(0),
  totalXP: z.number().int().min(0),
  streak: z.number().int().min(0),
  lastActive: z.date(),
}).refine(data => data.currentXP <= data.totalXP, {
  message: "Current XP cannot be greater than total XP",
});

export const userStatsSchema = z.object({
  totalMeasurements: z.number().int().min(0),
  ruralMeasurements: z.number().int().min(0),
  uniqueLocations: z.number().int().min(0),
  totalDistance: z.number().int().min(0),
  contributionScore: z.number().int().min(0),
}).refine(data => data.ruralMeasurements <= data.totalMeasurements, {
  message: "Rural measurements cannot exceed total measurements",
});

export const leaderboardEntrySchema = z.object({
  score: z.number().int().min(0),
  rank: z.number().int().min(1).optional(),
  timeframe: timeframeSchema,
});

// Validation functions
export function validateUserProgress(data: unknown) {
  return userProgressSchema.parse(data);
}

export function validateUserStats(data: unknown) {
  return userStatsSchema.parse(data);
}

export function validateLeaderboardEntry(data: unknown) {
  return leaderboardEntrySchema.parse(data);
}

// Error handling
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new ValidationError(error.errors.map(e => e.message).join(', '));
  }
  throw error;
}
