import {
  calculateAchievementProgress,
  isAchievementCompleted,
  getAchievementPoints,
  getTotalPoints,
  getRarityOrder,
  sortAchievementsByRarity,
  filterAchievementsByCompletion,
  searchAchievements
} from '../../../lib/gamification/achievements';
import { Achievement } from '../../../lib/gamification/types';

const mockAchievements: Achievement[] = [
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
  }
];

describe('calculateAchievementProgress', () => {
  it('calculates correct progress percentage', () => {
    const achievement = mockAchievements[1]; // Coverage Master
    expect(calculateAchievementProgress(achievement)).toBe(0.75); // 750/1000
  });

  it('caps progress at 100%', () => {
    const achievement = mockAchievements[0]; // Rural Pioneer
    expect(calculateAchievementProgress(achievement)).toBe(1); // 1/1
  });

  it('handles zero target gracefully', () => {
    const achievement = { ...mockAchievements[0], target: 0 };
    expect(calculateAchievementProgress(achievement)).toBe(1);
  });

  it('handles negative progress gracefully', () => {
    const achievement = { ...mockAchievements[0], progress: -1 };
    expect(calculateAchievementProgress(achievement)).toBe(0);
  });
});

describe('isAchievementCompleted', () => {
  it('returns true for completed achievements', () => {
    expect(isAchievementCompleted(mockAchievements[0])).toBe(true); // Rural Pioneer
    expect(isAchievementCompleted(mockAchievements[2])).toBe(true); // Speed Demon
  });

  it('returns false for incomplete achievements', () => {
    expect(isAchievementCompleted(mockAchievements[1])).toBe(false); // Coverage Master
  });
});

describe('getAchievementPoints', () => {
  it('returns points for completed achievements', () => {
    expect(getAchievementPoints(mockAchievements[0])).toBe(100); // Rural Pioneer
    expect(getAchievementPoints(mockAchievements[2])).toBe(250); // Speed Demon
  });

  it('returns 0 for incomplete achievements', () => {
    expect(getAchievementPoints(mockAchievements[1])).toBe(0); // Coverage Master
  });
});

describe('getTotalPoints', () => {
  it('calculates total points from completed achievements', () => {
    expect(getTotalPoints(mockAchievements)).toBe(350); // 100 + 0 + 250
  });

  it('returns 0 for empty achievements list', () => {
    expect(getTotalPoints([])).toBe(0);
  });
});

describe('getRarityOrder', () => {
  it('returns correct order for each rarity', () => {
    expect(getRarityOrder('epic')).toBe(0);
    expect(getRarityOrder('rare')).toBe(1);
    expect(getRarityOrder('common')).toBe(2);
  });
});

describe('sortAchievementsByRarity', () => {
  it('sorts achievements by rarity order', () => {
    const sorted = sortAchievementsByRarity(mockAchievements);
    expect(sorted[0].rarity).toBe('epic'); // Speed Demon
    expect(sorted[1].rarity).toBe('rare'); // Coverage Master
    expect(sorted[2].rarity).toBe('common'); // Rural Pioneer
  });

  it('maintains relative order within same rarity', () => {
    const achievements = [
      { ...mockAchievements[0], id: 'a1', rarity: 'common' },
      { ...mockAchievements[0], id: 'a2', rarity: 'common' }
    ];
    const sorted = sortAchievementsByRarity(achievements);
    expect(sorted[0].id).toBe('a1');
    expect(sorted[1].id).toBe('a2');
  });

  it('handles empty array', () => {
    expect(sortAchievementsByRarity([])).toEqual([]);
  });
});

describe('filterAchievementsByCompletion', () => {
  it('filters completed achievements', () => {
    const completed = filterAchievementsByCompletion(mockAchievements, true);
    expect(completed).toHaveLength(2);
    expect(completed.every(a => a.completed)).toBe(true);
  });

  it('filters incomplete achievements', () => {
    const incomplete = filterAchievementsByCompletion(mockAchievements, false);
    expect(incomplete).toHaveLength(1);
    expect(incomplete.every(a => !a.completed)).toBe(true);
  });

  it('handles empty array', () => {
    expect(filterAchievementsByCompletion([], true)).toEqual([]);
    expect(filterAchievementsByCompletion([], false)).toEqual([]);
  });
});

describe('searchAchievements', () => {
  it('searches achievements by title', () => {
    const results = searchAchievements(mockAchievements, 'Rural');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('rural-pioneer');
  });

  it('searches achievements by description', () => {
    const results = searchAchievements(mockAchievements, 'measurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(a => a.id === 'rural-pioneer')).toBe(true);
  });

  it('is case insensitive', () => {
    const results = searchAchievements(mockAchievements, 'rural');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('rural-pioneer');
  });

  it('returns empty array for no matches', () => {
    const results = searchAchievements(mockAchievements, 'nonexistent');
    expect(results).toHaveLength(0);
  });

  it('handles empty search query', () => {
    const results = searchAchievements(mockAchievements, '');
    expect(results).toEqual(mockAchievements);
  });
});
