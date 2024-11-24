export const ACHIEVEMENT_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

export type AchievementTier = typeof ACHIEVEMENT_TIERS[keyof typeof ACHIEVEMENT_TIERS];

export const TIER_COLORS: Record<AchievementTier, string> = {
  [ACHIEVEMENT_TIERS.BRONZE]: 'text-orange-600',
  [ACHIEVEMENT_TIERS.SILVER]: 'text-gray-400',
  [ACHIEVEMENT_TIERS.GOLD]: 'text-yellow-400',
  [ACHIEVEMENT_TIERS.PLATINUM]: 'text-yellow-500',
} as const;
