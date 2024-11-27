import { 
  AchievementSchema,
  UserStatsSchema,
  StatsContentSchema,
  UserProgressSchema,
  RequirementSchema,
  RequirementType,
  RequirementOperator,
  ValidatedUserStats,
  ValidatedUserProgress,
  ValidatedAchievement,
  Requirement,
  MeasurementInputSchema,
  ValidatedMeasurementInput,
  TransactionContext,
  StatsContent,
  StatsMetric
} from './types';
import { ValidationError, DatabaseError } from './errors';
import { z } from 'zod';

export function validateAchievement(data: unknown): ValidatedAchievement {
  try {
    return AchievementSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid achievement data', error.errors);
    }
    throw error;
  }
}

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

export function validateStatsContent(data: unknown): StatsContent {
  try {
    const parsed = StatsContentSchema.parse(data);
    // Ensure all required stats metrics have valid values
    const defaultStats: StatsContent = {
      [StatsMetric.TOTAL_MEASUREMENTS]: 0,
      [StatsMetric.RURAL_MEASUREMENTS]: 0,
      [StatsMetric.VERIFIED_SPOTS]: 0,
      [StatsMetric.HELPFUL_ACTIONS]: 0,
      [StatsMetric.CONSECUTIVE_DAYS]: 0,
      [StatsMetric.QUALITY_SCORE]: 0,
      [StatsMetric.ACCURACY_RATE]: 0,
      [StatsMetric.UNIQUE_LOCATIONS]: 0,
      [StatsMetric.TOTAL_DISTANCE]: 0,
      [StatsMetric.CONTRIBUTION_SCORE]: 0
    };
    return { ...defaultStats, ...parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid stats content data', error.errors);
    }
    throw error;
  }
}

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

export function validateMeasurementInput(data: unknown): ValidatedMeasurementInput {
  try {
    return MeasurementInputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid measurement input', error.errors);
    }
    throw error;
  }
}

export function validateRequirement(data: unknown): Requirement {
  try {
    const requirement = RequirementSchema.parse(data);
    
    // Additional validation for requirement metrics
    if (requirement.type === RequirementType.STAT) {
      if (!Object.values(StatsMetric).includes(requirement.metric as StatsMetric)) {
        throw new ValidationError(`Invalid stat metric: ${requirement.metric}`);
      }
    }
    
    // Validate operator based on requirement type
    const validOperators = new Set<RequirementOperator>();
    switch (requirement.type) {
      case RequirementType.STAT:
      case RequirementType.LEVEL:
        validOperators.add(RequirementOperator.GREATER_THAN);
        validOperators.add(RequirementOperator.GREATER_THAN_EQUAL);
        validOperators.add(RequirementOperator.LESS_THAN);
        validOperators.add(RequirementOperator.LESS_THAN_EQUAL);
        validOperators.add(RequirementOperator.EQUAL);
        break;
      case RequirementType.STREAK:
        validOperators.add(RequirementOperator.GREATER_THAN_EQUAL);
        break;
      case RequirementType.ACHIEVEMENT:
        validOperators.add(RequirementOperator.EQUAL);
        break;
    }

    if (!validOperators.has(requirement.operator)) {
      throw new ValidationError(
        `Invalid operator ${requirement.operator} for requirement type ${requirement.type}`
      );
    }

    return requirement;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid requirement data', error.errors);
    }
    throw error;
  }
}

export function checkRequirementMet(
  requirement: Requirement,
  stats: StatsContent | ValidatedUserProgress,
  context?: TransactionContext
): boolean {
  try {
    let value: number;
    
    switch (requirement.type) {
      case RequirementType.STAT:
        value = (stats as StatsContent)[requirement.metric as StatsMetric] || 0;
        break;
      case RequirementType.LEVEL:
        value = (stats as ValidatedUserProgress).level;
        break;
      case RequirementType.STREAK:
        value = (stats as StatsContent)[StatsMetric.CONSECUTIVE_DAYS];
        break;
      case RequirementType.ACHIEVEMENT:
        if (!context) {
          throw new ValidationError('Context required for achievement requirements');
        }
        return checkAchievementRequirement(requirement.metric, context);
      default:
        throw new ValidationError(`Invalid requirement type: ${requirement.type}`);
    }

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
      default:
        throw new ValidationError(`Invalid operator: ${requirement.operator}`);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Error checking requirement', error);
  }
}

async function checkAchievementRequirement(
  achievementId: string,
  context: TransactionContext
): Promise<boolean> {
  try {
    const userAchievement = await context.tx.userAchievement.findUnique({
      where: {
        userProgressId_achievementId: {
          userProgressId: context.userId,
          achievementId
        }
      }
    });
    return !!userAchievement?.completed;
  } catch (error) {
    throw new DatabaseError('Failed to check achievement requirement', error);
  }
}

export function calculateProgress(
  requirement: Requirement,
  stats: StatsContent | ValidatedUserProgress
): number {
  try {
    const { type, metric, value } = requirement;
    let actualValue: number;

    // Get the actual value based on requirement type
    switch (type) {
      case RequirementType.STAT: {
        const statsContent = stats as StatsContent;
        const metricKey = metric as keyof StatsContent;
        if (!(metricKey in statsContent)) {
          throw new ValidationError(`Invalid stat metric: ${metric}`);
        }
        actualValue = statsContent[metricKey];
        break;
      }
      case RequirementType.LEVEL: {
        const progress = stats as ValidatedUserProgress;
        if (!('level' in progress)) {
          throw new ValidationError('Stats object does not contain level');
        }
        actualValue = progress.level;
        break;
      }
      case RequirementType.STREAK: {
        const progress = stats as ValidatedUserProgress;
        if (!('streak' in progress)) {
          throw new ValidationError('Stats object does not contain streak');
        }
        actualValue = progress.streak;
        break;
      }
      case RequirementType.ACHIEVEMENT:
        // Achievement requirements are binary (completed or not)
        // We don't calculate partial progress for achievements
        return 0;
      default:
        throw new ValidationError(`Invalid requirement type: ${type}`);
    }

    // Calculate progress percentage with bounds checking
    const progress = Math.floor((actualValue / value) * 100);
    return Math.max(0, Math.min(progress, 100));
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Error calculating progress', error);
  }
}

export function calculateRequiredXP(level: number): number {
  if (level < 1) {
    throw new ValidationError('Level must be greater than 0');
  }
  // XP curve: Each level requires 20% more XP than the previous level
  const baseXP = 1000;
  const growthRate = 1.2;
  return Math.floor(baseXP * Math.pow(growthRate, level - 1));
}

export function calculateLevel(totalXP: number): {
  level: number;
  currentXP: number;
  nextLevelXP: number;
} {
  if (totalXP < 0) {
    throw new ValidationError('Total XP cannot be negative');
  }

  let level = 1;
  let xpForNextLevel = calculateRequiredXP(level);
  let remainingXP = totalXP;

  // Find the current level
  while (remainingXP >= xpForNextLevel) {
    remainingXP -= xpForNextLevel;
    level++;
    xpForNextLevel = calculateRequiredXP(level);
  }

  return {
    level,
    currentXP: remainingXP,
    nextLevelXP: xpForNextLevel
  };
}
