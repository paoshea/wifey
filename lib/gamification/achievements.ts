import { Achievement } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    points: 100,
    rarity: 'common',
    progress: 1,
    target: 1,
    completed: true,
    earnedDate: '2024-01-01',
    requirements: {
      type: 'rural_measurements',
      count: 1
    }
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    points: 500,
    rarity: 'rare',
    progress: 750,
    target: 1000,
    completed: false,
    requirements: {
      type: 'measurements',
      count: 1000
    }
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    points: 250,
    rarity: 'epic',
    progress: 50,
    target: 50,
    completed: true,
    earnedDate: '2024-01-15',
    requirements: {
      type: 'measurements',
      count: 50
    }
  },
  {
    id: 'consistency-king',
    title: 'Consistency King',
    description: 'Submit measurements for 30 consecutive days',
    icon: '👑',
    points: 1000,
    rarity: 'epic',
    progress: 15,
    target: 30,
    completed: false,
    requirements: {
      type: 'consistency',
      count: 30
    }
  },
  {
    id: 'helpful-hero',
    title: 'Helpful Hero',
    description: 'Help 25 users find better coverage',
    icon: '🤝',
    points: 300,
    rarity: 'rare',
    progress: 10,
    target: 25,
    completed: false,
    requirements: {
      type: 'helping_others',
      count: 25
    }
  }
];

// Constants for point calculations
export const RURAL_BONUS_MULTIPLIER = 1.5;
export const FIRST_IN_AREA_BONUS = 20;
export const QUALITY_BONUS_MAX = 10;

// Level thresholds (exponential growth)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  4000,   // Level 7
  8000,   // Level 8
  16000,  // Level 9
  32000   // Level 10
];

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getNextLevelThreshold(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

export function calculateAchievementProgress(achievement: Achievement): number {
  if (!achievement.target || achievement.target <= 0) {
    return 0;
  }
  const progress = Math.max(0, achievement.progress);
  return Math.min(1, progress / achievement.target);
}

export function isAchievementCompleted(achievement: Achievement): boolean {
  return achievement.progress >= achievement.target;
}

export function getAchievementPoints(achievement: Achievement): number {
  if (!achievement.completed) return 0;
  return achievement.points;
}

export function getTotalPoints(achievements: Achievement[]): number {
  return achievements.reduce((total, achievement) => total + getAchievementPoints(achievement), 0);
}

export function getRarityOrder(rarity: Achievement['rarity']): number {
  const order = { epic: 0, rare: 1, common: 2 };
  return order[rarity];
}

export function sortAchievementsByRarity(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => getRarityOrder(a.rarity) - getRarityOrder(b.rarity));
}

export function filterAchievementsByCompletion(achievements: Achievement[], completed: boolean): Achievement[] {
  return achievements.filter(achievement => achievement.completed === completed);
}

export function searchAchievements(achievements: Achievement[], query: string): Achievement[] {
  const lowercaseQuery = query.toLowerCase();
  return achievements.filter(achievement => 
    achievement.title.toLowerCase().includes(lowercaseQuery) ||
    achievement.description.toLowerCase().includes(lowercaseQuery)
  );
}
