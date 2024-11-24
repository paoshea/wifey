import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Base schemas
export const userIdSchema = z.string().min(1);
export const achievementIdSchema = z.string().min(1);
export const timeframeSchema = z.enum(['daily', 'weekly', 'monthly', 'allTime']);

// Location schema
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Measurement schema
export const measurementSchema = z.object({
  isRural: z.boolean(),
  location: locationSchema.optional(),
});

export type ValidMeasurement = z.infer<typeof measurementSchema>;

// User Progress schema
export const userProgressSchema = z.object({
  level: z.number().int().min(1),
  currentXP: z.number().int().min(0),
  totalXP: z.number().int().min(0),
  streak: z.number().int().min(0),
  lastActive: z.date(),
}).refine(data => data.currentXP <= data.totalXP, {
  message: "Current XP cannot be greater than total XP",
});

export type ValidUserProgress = z.infer<typeof userProgressSchema>;

// User Stats schema
export const userStatsSchema = z.object({
  totalMeasurements: z.number().int().min(0),
  ruralMeasurements: z.number().int().min(0),
  uniqueLocations: z.number().int().min(0),
  totalDistance: z.number().min(0),
  contributionScore: z.number().min(0),
  verifiedSpots: z.number().int().min(0).optional(),
  helpfulActions: z.number().int().min(0).optional(),
  consecutiveDays: z.number().int().min(0).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  accuracyRate: z.number().min(0).max(100).optional(),
}).refine(data => data.ruralMeasurements <= data.totalMeasurements, {
  message: "Rural measurements cannot exceed total measurements",
});

export type ValidUserStats = z.infer<typeof userStatsSchema>;

// Leaderboard Entry schema
export const leaderboardEntrySchema = z.object({
  score: z.number().int().min(0),
  rank: z.number().int().min(1).optional().nullable(),
  timeframe: timeframeSchema,
});

export type ValidLeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Rank History schema
export const rankHistorySchema = z.object({
  rank: z.number().int().min(1),
  timeframe: timeframeSchema,
  date: z.date().optional(),
});

export type ValidRankHistory = z.infer<typeof rankHistorySchema>;

// Error Log schema
export const errorLogSchema = z.object({
  errorType: z.string().min(1),
  message: z.string().min(1),
  stack: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  severity: z.enum(['info', 'warning', 'error', 'fatal']),
});

export type ValidErrorLog = z.infer<typeof errorLogSchema>;

// Performance Log schema
export const performanceLogSchema = z.object({
  operation: z.string().min(1),
  duration: z.number().int().min(0),
  success: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type ValidPerformanceLog = z.infer<typeof performanceLogSchema>;

// Validation functions
export function validateUserProgress(data: unknown): ValidUserProgress {
  return userProgressSchema.parse(data);
}

export function validateUserStats(data: unknown): ValidUserStats {
  return userStatsSchema.parse(data);
}

export function validateLeaderboardEntry(data: unknown): ValidLeaderboardEntry {
  return leaderboardEntrySchema.parse(data);
}

export function validateMeasurement(data: unknown): ValidMeasurement {
  return measurementSchema.parse(data);
}

export function validateRankHistory(data: unknown): ValidRankHistory {
  return rankHistorySchema.parse(data);
}

export function validateErrorLog(data: unknown): ValidErrorLog {
  return errorLogSchema.parse(data);
}

export function validatePerformanceLog(data: unknown): ValidPerformanceLog {
  return performanceLogSchema.parse(data);
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

// Type guards
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Error && 'code' in error;
}

// Utility types
export type TimeFrame = z.infer<typeof timeframeSchema>;
export type Severity = z.infer<typeof errorLogSchema.shape.severity>;

// Helper functions
export function createValidationError(message: string): ValidationError {
  return new ValidationError(message);
}
