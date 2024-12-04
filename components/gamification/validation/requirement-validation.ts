import { z } from 'zod';
import {
  Requirement,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  StatsContent
} from 'lib/gamification/types';

export function validateRequirement(
  requirement: Requirement,
  stats: StatsContent
) {
  try {
    // Validate requirement has valid metric
    if (!(requirement.metric in StatsMetric)) {
      return {
        success: false,
        error: `Invalid metric: ${requirement.metric}`
      };
    }

    // Get stat value, using type-safe access
    const statValue = stats[requirement.metric];

    // Validate the requirement based on operator
    let isValid = false;
    switch (requirement.operator) {
      case RequirementOperator.EQUAL:
        isValid = statValue === requirement.value;
        break;
      case RequirementOperator.NOT_EQUAL:
        isValid = statValue !== requirement.value;
        break;
      case RequirementOperator.GREATER_THAN:
        isValid = statValue > requirement.value;
        break;
      case RequirementOperator.LESS_THAN:
        isValid = statValue < requirement.value;
        break;
      case RequirementOperator.GREATER_THAN_EQUAL:
        isValid = statValue >= requirement.value;
        break;
      case RequirementOperator.LESS_THAN_EQUAL:
        isValid = statValue <= requirement.value;
        break;
      default:
        return {
          success: false,
          error: `Invalid operator: ${requirement.operator}`
        };
    }

    return {
      success: true,
      data: {
        ...requirement,
        isMet: isValid,
        currentValue: statValue
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

export function checkRequirementMet(
  requirement: Requirement,
  stats: StatsContent
): boolean {
  const result = validateRequirement(requirement, stats);
  return result.success && result.data?.isMet || false;
}
