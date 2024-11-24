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
    rarity: 'common' as const,
    tier: 'bronze' as const,
    progress: 1,
    target: 1,
    category: 'RURAL_EXPLORER' as const,
    requirements: [{
      type: 'rural_measurements' as const,
      count: 1
    }]
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    points: 500,
    rarity: 'epic' as const,
    tier: 'platinum' as const,
    progress: 750,
    target: 1000,
    category: 'COVERAGE_EXPERT' as const,
    requirements: [{
      type: 'measurements' as const,
      count: 1000
    }]
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    points: 250,
    rarity: 'rare' as const,
    tier: 'gold' as const,
    progress: 50,
    target: 50,
    category: 'CONSISTENT_MAPPER' as const,
    requirements: [{
      type: 'measurements' as const,
      count: 50
    }]
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
  it('correctly identifies completed achievements', () => {
    const completed = mockAchievements.filter(isAchievementCompleted);
    expect(completed.length).toBe(2);
    expect(completed[0].id).toBe('rural-pioneer');
    expect(completed[1].id).toBe('speed-demon');
  });
});

describe('getAchievementPoints', () => {
  it('returns points for completed achievements', () => {
    const ruralPioneer = mockAchievements[0];
    const speedDemon = mockAchievements[2];
    
    expect(getAchievementPoints(ruralPioneer)).toBe(100);
    expect(getAchievementPoints(speedDemon)).toBe(250);
  });

  it('returns 0 for incomplete achievements', () => {
    const coverageMaster = mockAchievements[1];
    expect(getAchievementPoints(coverageMaster)).toBe(0);
  });
});

describe('getTotalPoints', () => {
  it('sums points from all completed achievements', () => {
    const total = getTotalPoints(mockAchievements);
    // Rural Pioneer (100) + Speed Demon (250) = 350
    expect(total).toBe(350);
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
    expect(sorted[0].rarity).toBe('epic'); // Coverage Master
    expect(sorted[1].rarity).toBe('rare'); // Speed Demon
    expect(sorted[2].rarity).toBe('common'); // Rural Pioneer
  });

  it('maintains relative order within same rarity', () => {
    const achievements: Achievement[] = [
      {
        id: 'a1',
        title: 'First Epic',
        description: 'First epic achievement',
        icon: '🏆',
        points: 500,
        rarity: 'epic' as const,
        tier: 'platinum' as const,
        progress: 100,
        target: 100,
        category: 'COVERAGE_EXPERT' as const,
        requirements: [{
          type: 'measurements' as const,
          count: 100
        }]
      },
      {
        id: 'a2',
        title: 'Second Epic',
        description: 'Second epic achievement',
        icon: '🎖️',
        points: 600,
        rarity: 'epic' as const,
        tier: 'platinum' as const,
        progress: 200,
        target: 200,
        category: 'COVERAGE_EXPERT' as const,
        requirements: [{
          type: 'measurements' as const,
          count: 200
        }]
      }
    ];

    const sorted = sortAchievementsByRarity(achievements);
    expect(sorted[0].id).toBe('a1'); // Should maintain original order
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
    expect(completed.every(a => a.progress >= a.target)).toBe(true);
  });

  it('filters incomplete achievements', () => {
    const incomplete = filterAchievementsByCompletion(mockAchievements, false);
    expect(incomplete).toHaveLength(1);
    expect(incomplete.every(a => a.progress < a.target)).toBe(true);
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
