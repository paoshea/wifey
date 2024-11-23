import { Achievement, AchievementCategory } from './types';

export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Rural Explorer Achievements
  rural_explorer_bronze: {
    id: 'rural_explorer_bronze',
    category: 'RURAL_EXPLORER',
    title: 'Rural Pioneer',
    description: 'Map coverage in 5 different rural areas',
    points: 100,
    icon: '🌾',
    requirements: {
      type: 'rural_measurements',
      count: 5
    },
    tier: 'bronze'
  },
  rural_explorer_silver: {
    id: 'rural_explorer_silver',
    category: 'RURAL_EXPLORER',
    title: 'Rural Pathfinder',
    description: 'Map coverage in 25 different rural areas',
    points: 500,
    icon: '🚜',
    requirements: {
      type: 'rural_measurements',
      count: 25
    },
    tier: 'silver'
  },
  rural_explorer_gold: {
    id: 'rural_explorer_gold',
    category: 'RURAL_EXPLORER',
    title: 'Rural Champion',
    description: 'Map coverage in 100 different rural areas',
    points: 2000,
    icon: '🌟',
    requirements: {
      type: 'rural_measurements',
      count: 100
    },
    tier: 'gold'
  },

  // Coverage Pioneer Achievements
  first_area_bronze: {
    id: 'first_area_bronze',
    category: 'COVERAGE_PIONEER',
    title: 'Trail Blazer',
    description: 'Be the first to map 3 unmapped areas',
    points: 150,
    icon: '🎯',
    requirements: {
      type: 'measurements',
      count: 3
    },
    tier: 'bronze'
  },
  first_area_gold: {
    id: 'first_area_gold',
    category: 'COVERAGE_PIONEER',
    title: 'Coverage Explorer',
    description: 'Be the first to map 50 unmapped areas',
    points: 3000,
    icon: '🗺️',
    requirements: {
      type: 'measurements',
      count: 50
    },
    tier: 'gold'
  },

  // Consistency Achievements
  weekly_mapper: {
    id: 'weekly_mapper',
    category: 'CONSISTENT_MAPPER',
    title: 'Weekly Mapper',
    description: 'Submit measurements for 7 consecutive days',
    points: 200,
    icon: '📅',
    requirements: {
      type: 'consistency',
      count: 7
    },
    tier: 'bronze'
  },
  monthly_mapper: {
    id: 'monthly_mapper',
    category: 'CONSISTENT_MAPPER',
    title: 'Coverage Guardian',
    description: 'Submit measurements for 30 consecutive days',
    points: 1000,
    icon: '🛡️',
    requirements: {
      type: 'consistency',
      count: 30
    },
    tier: 'gold'
  },

  // Community Helper Achievements
  helpful_bronze: {
    id: 'helpful_bronze',
    category: 'COMMUNITY_HELPER',
    title: 'Community Guide',
    description: 'Help 5 users find better coverage',
    points: 100,
    icon: '🤝',
    requirements: {
      type: 'helping_others',
      count: 5
    },
    tier: 'bronze'
  },
  helpful_platinum: {
    id: 'helpful_platinum',
    category: 'COMMUNITY_HELPER',
    title: 'Coverage Hero',
    description: 'Help 100 users find better coverage',
    points: 5000,
    icon: '👑',
    requirements: {
      type: 'helping_others',
      count: 100
    },
    tier: 'platinum'
  }
};

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5200,   // Level 10
  6600,   // Level 11
  8200,   // Level 12
  10000,  // Level 13
  12000,  // Level 14
  14500,  // Level 15
];

export const RURAL_BONUS_MULTIPLIER = 2; // Double points for rural areas
export const FIRST_IN_AREA_BONUS = 50;   // Bonus points for being first in an area
export const STREAK_BONUS_MULTIPLIER = 1.5; // 50% bonus for maintaining streaks

export function calculateLevel(points: number): number {
  return LEVEL_THRESHOLDS.findIndex(threshold => points < threshold) || LEVEL_THRESHOLDS.length;
}

export function getNextLevelThreshold(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  return LEVEL_THRESHOLDS[currentLevel] || Infinity;
}

export function getLevelProgress(points: number): { progress: number; nextThreshold: number } {
  const currentLevel = calculateLevel(points);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold;
  
  const progress = (points - currentThreshold) / (nextThreshold - currentThreshold);
  return { progress, nextThreshold };
}
