export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'points' | 'streak' | 'contributions';
    threshold: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  userId: string;
  points: number;
  streak: {
    current: number;
    longest: number;
    lastContribution: string; // ISO date string
  };
  contributions: number;
  badges: string[]; // Badge IDs
}

export const BADGES: Badge[] = [
  {
    id: 'first-mark',
    name: 'First X',
    description: 'Marked your first coverage spot',
    icon: '🎯',
    requirement: { type: 'contributions', threshold: 1 },
    rarity: 'common'
  },
  {
    id: 'streak-3',
    name: 'Consistent Explorer',
    description: 'Maintained a 3-day contribution streak',
    icon: '🔥',
    requirement: { type: 'streak', threshold: 3 },
    rarity: 'common'
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: 'Maintained a 7-day contribution streak',
    icon: '⚡',
    requirement: { type: 'streak', threshold: 7 },
    rarity: 'rare'
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintained a 30-day contribution streak',
    icon: '👑',
    requirement: { type: 'streak', threshold: 30 },
    rarity: 'epic'
  },
  {
    id: 'points-100',
    name: 'Century Club',
    description: 'Earned 100 points',
    icon: '💯',
    requirement: { type: 'points', threshold: 100 },
    rarity: 'rare'
  },
  {
    id: 'points-1000',
    name: 'Coverage King',
    description: 'Earned 1000 points',
    icon: '👑',
    requirement: { type: 'points', threshold: 1000 },
    rarity: 'legendary'
  },
  {
    id: 'contributions-10',
    name: 'Signal Scout',
    description: 'Marked 10 coverage spots',
    icon: '📡',
    requirement: { type: 'contributions', threshold: 10 },
    rarity: 'common'
  },
  {
    id: 'contributions-50',
    name: 'Coverage Champion',
    description: 'Marked 50 coverage spots',
    icon: '🏆',
    requirement: { type: 'contributions', threshold: 50 },
    rarity: 'epic'
  },
  {
    id: 'contributions-100',
    name: 'Signal Sage',
    description: 'Marked 100 coverage spots',
    icon: '🌟',
    requirement: { type: 'contributions', threshold: 100 },
    rarity: 'legendary'
  }
];
