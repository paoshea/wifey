// lib/gamification/validation/achievement-validation.ts

import { z } from 'zod';
import {
  Achievement,
  Requirement,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  StatsContent
} from 'lib/gamification/types';
import { validateRequirement } from './requirement-validation';

const requirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.nativeEnum(StatsMetric),
  operator: z.nativeEnum(RequirementOperator),
  value: z.number().min(0),
  description: z.string()  // Make description required
});

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  points: z.number().min(0),
  rarity: z.string(),
  tier: z.string(),
  category: z.string(),
  requirements: z.array(requirementSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

export function validateAchievementRequirements(
  requirements: Requirement[],
  stats: StatsContent
) {
  try {
    // First validate the requirements schema
    const validatedRequirements = requirements.map((req: Requirement) => {
      // Ensure description is present
      if (!req.description) {
        throw new Error('Requirement description is required');
      }

      const result = requirementSchema.safeParse(req);
      if (!result.success) {
        throw new Error(`Invalid requirement: ${result.error}`);
      }
      return result.data;
    });

    // Then validate each requirement against stats
    const validatedResults = validatedRequirements.map((req: z.infer<typeof requirementSchema>) => {
      const result = validateRequirement(req, stats);
      if (!result.success) {
        throw new Error(`Requirement validation failed: ${result.error}`);
      }
      return result.data;
    });

    return {
      success: true,
      data: validatedResults
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

export function validateAchievement(achievement: Achievement) {
  return achievementSchema.safeParse(achievement);
}
