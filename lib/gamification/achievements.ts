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
    earnedDate: '2024-01-01'
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
    completed: false
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
    earnedDate: '2024-01-15'
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
    completed: false
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
    completed: false
  }
];

// Helper functions for achievement calculations
export function calculateAchievementProgress(achievement: Achievement): number {
  return Math.min(achievement.progress / achievement.target, 1);
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
