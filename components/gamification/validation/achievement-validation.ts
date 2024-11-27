import { z } from 'zod';
import { 
  Achievement,
  Requirement,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  StatsContent
} from '../types';
import { validateRequirement } from './requirement-validation';

const requirementSchema = z.object({
  type: z.nativeEnum(RequirementType),
  metric: z.nativeEnum(StatsMetric),
  operator: z.nativeEnum(RequirementOperator),
  value: z.number().min(0),
  description: z.string().optional()
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
    const validatedRequirements = requirements.map(req => {
      const result = requirementSchema.safeParse(req);
      if (!result.success) {
        throw new Error(`Invalid requirement: ${result.error}`);
      }
      return result.data;
    });

    // Then validate each requirement against stats
    const validatedResults = validatedRequirements.map(req => {
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
