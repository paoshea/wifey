import { Achievement } from '@prisma/client';
import { ACHIEVEMENT_TIERS } from './constants';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    points: 100,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: 'RURAL',
    requirements: {
      type: 'rural_measurements',
      count: 1
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 100 unique locations',
    icon: '📱',
    points: 500,
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: 'COVERAGE',
    requirements: {
      type: 'unique_locations',
      count: 100
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    points: 250,
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: 'SPEED',
    requirements: {
      type: 'measurements',
      count: 50
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'consistency-king',
    title: 'Consistency King',
    description: 'Submit measurements for 30 consecutive days',
    icon: '👑',
    points: 1000,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    category: 'CONSISTENCY',
    requirements: {
      type: 'consistency',
      count: 30
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'helpful-hero',
    title: 'Helpful Hero',
    description: 'Help 25 users find better coverage',
    icon: '🤝',
    points: 300,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: 'HELPING',
    requirements: {
      type: 'helping_others',
      count: 25
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function getNextLevelThreshold(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

export function getTotalPoints(achievements: Achievement[]): number {
  return achievements.reduce((total, achievement) => total + achievement.points, 0);
}

export function getTierOrder(tier: Achievement['tier']): number {
  const order = {
    [ACHIEVEMENT_TIERS.BRONZE]: 0,
    [ACHIEVEMENT_TIERS.SILVER]: 1,
    [ACHIEVEMENT_TIERS.GOLD]: 2,
    [ACHIEVEMENT_TIERS.PLATINUM]: 3,
  };
  return order[tier] || 0;
}

export function sortAchievementsByTier(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => getTierOrder(b.tier) - getTierOrder(a.tier));
}

export function searchAchievements(achievements: Achievement[], query: string): Achievement[] {
  const lowercaseQuery = query.toLowerCase();
  return achievements.filter(achievement => 
    achievement.title.toLowerCase().includes(lowercaseQuery) ||
    achievement.description.toLowerCase().includes(lowercaseQuery)
  );
}
