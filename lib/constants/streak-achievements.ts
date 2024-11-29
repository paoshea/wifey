export const STREAK_ACHIEVEMENTS = [
  {
    id: 'first_checkin',
    title: 'First Check-in',
    description: 'Complete your first daily check-in',
    points: 10,
    threshold: 1,
    icon: '🌱'
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    points: 50,
    threshold: 7,
    icon: '🔥'
  },
  {
    id: 'fortnight_force',
    title: 'Fortnight Force',
    description: 'Maintain a 14-day streak',
    points: 100,
    threshold: 14,
    icon: '⚡'
  },
  {
    id: 'monthly_master',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    points: 250,
    threshold: 30,
    icon: '🌟'
  },
  {
    id: 'quarterly_queen',
    title: 'Quarterly Queen',
    description: 'Maintain a 90-day streak',
    points: 1000,
    threshold: 90,
    icon: '👑'
  },
  {
    id: 'yearly_legend',
    title: 'Yearly Legend',
    description: 'Maintain a 365-day streak',
    points: 5000,
    threshold: 365,
    icon: '🏆'
  }
] as const;

export const STREAK_BONUSES = {
  DAILY_BONUS: 10,
  MULTIPLIERS: {
    7: 1.5,   // 7-day streak: 1.5x points
    14: 2,    // 14-day streak: 2x points
    30: 3,    // 30-day streak: 3x points
    90: 4,    // 90-day streak: 4x points
    365: 5    // 365-day streak: 5x points
  }
} as const;
