import { AchievementTier, RequirementType, RequirementOperator } from './types';

// Achievement point values
export const POINT_VALUES = {
  COMMON: 100,
  RARE: 250,
  EPIC: 500
} as const;

// Bonus multipliers and constants
export const BONUS_MULTIPLIERS = {
  RURAL_AREA: 1.5,
  FIRST_IN_AREA: 50,
  QUALITY_MAX: 10,
  STREAK_MAX: 7
} as const;

// Base XP values
export const XP_VALUES = {
  BASE_MEASUREMENT: 10,
  RURAL_BONUS: 5,
  FIRST_IN_AREA: 25,
  ACHIEVEMENT_COMMON: 50,
  ACHIEVEMENT_RARE: 100,
  ACHIEVEMENT_EPIC: 200
} as const;

// Default achievement definitions - these will be stored in the database
export const DEFAULT_ACHIEVEMENTS = [
  {
    title: 'First Steps',
    description: 'Make your first measurement',
    icon: '🎯',
    points: POINT_VALUES.COMMON,
    tier: AchievementTier.COMMON,
    requirements: [{
      type: RequirementType.STAT,
      metric: 'totalMeasurements',
      value: 1,
      operator: RequirementOperator.GREATER_THAN_EQUAL
    }]
  },
  {
    title: 'Rural Explorer',
    description: 'Make measurements in rural areas',
    icon: '🌾',
    points: POINT_VALUES.RARE,
    tier: AchievementTier.RARE,
    requirements: [{
      type: RequirementType.STAT,
      metric: 'ruralMeasurements',
      value: 10,
      operator: RequirementOperator.GREATER_THAN_EQUAL
    }]
  },
  {
    title: 'Quality Controller',
    description: 'Maintain high quality measurements',
    icon: '⭐',
    points: POINT_VALUES.RARE,
    tier: AchievementTier.RARE,
    requirements: [{
      type: RequirementType.STAT,
      metric: 'qualityScore',
      value: 90,
      operator: RequirementOperator.GREATER_THAN_EQUAL
    }]
  },
  {
    title: 'Consistency King',
    description: 'Maintain a 7-day measurement streak',
    icon: '👑',
    points: POINT_VALUES.EPIC,
    tier: AchievementTier.EPIC,
    requirements: [{
      type: RequirementType.STREAK,
      metric: 'streak',
      value: 7,
      operator: RequirementOperator.GREATER_THAN_EQUAL
    }]
  },
  {
    title: 'Community Helper',
    description: 'Help verify other users\' measurements',
    icon: '🤝',
    points: POINT_VALUES.RARE,
    tier: AchievementTier.RARE,
    requirements: [{
      type: RequirementType.STAT,
      metric: 'helpfulActions',
      value: 25,
      operator: RequirementOperator.GREATER_THAN_EQUAL
    }]
  }
] as const;

// Contribution calculation functions
export function calculateMeasurementPoints(params: {
  isRural: boolean;
  isFirstInArea: boolean;
  quality: number;
  streak: number;
}): {
  points: number;
  xp: number;
  bonuses: Record<string, number>;
} {
  const { isRural, isFirstInArea, quality, streak } = params;
  let points = XP_VALUES.BASE_MEASUREMENT;
  let xp = XP_VALUES.BASE_MEASUREMENT;
  const bonuses: Record<string, number> = {};

  // Rural bonus
  if (isRural) {
    const ruralBonus = Math.round(points * (BONUS_MULTIPLIERS.RURAL_AREA - 1));
    points += ruralBonus;
    xp += XP_VALUES.RURAL_BONUS;
    bonuses.ruralArea = ruralBonus;
  }

  // First in area bonus
  if (isFirstInArea) {
    points += BONUS_MULTIPLIERS.FIRST_IN_AREA;
    xp += XP_VALUES.FIRST_IN_AREA;
    bonuses.firstInArea = BONUS_MULTIPLIERS.FIRST_IN_AREA;
  }

  // Quality bonus
  const qualityBonus = Math.round((quality / 100) * BONUS_MULTIPLIERS.QUALITY_MAX);
  points += qualityBonus;
  bonuses.quality = qualityBonus;

  // Streak bonus
  if (streak > 0) {
    const streakBonus = Math.min(streak, BONUS_MULTIPLIERS.STREAK_MAX);
    points += streakBonus;
    bonuses.streak = streakBonus;
  }

  return { points, xp, bonuses };
}

// Achievement XP calculation
export function calculateAchievementXP(tier: AchievementTier): number {
  switch (tier) {
    case AchievementTier.COMMON:
      return XP_VALUES.ACHIEVEMENT_COMMON;
    case AchievementTier.RARE:
      return XP_VALUES.ACHIEVEMENT_RARE;
    case AchievementTier.EPIC:
      return XP_VALUES.ACHIEVEMENT_EPIC;
    default:
      return 0;
  }
}
