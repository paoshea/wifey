import {
  calculateLevel,
  calculateProgress,
  getNextLevelThreshold,
  formatActivityData,
  calculateAchievementProgress,
  getRarityColor,
  sortAchievements,
  filterAchievements
} from '../gamification-utils';

describe('calculateLevel', () => {
  it('calculates correct level based on points', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(500)).toBe(3);
    expect(calculateLevel(1500)).toBe(4);
    expect(calculateLevel(5000)).toBe(5);
  });

  it('handles edge cases', () => {
    expect(calculateLevel(-100)).toBe(1); // Negative points
    expect(calculateLevel(999999)).toBe(10); // Max level cap
  });
});

describe('calculateProgress', () => {
  it('calculates correct progress percentage', () => {
    expect(calculateProgress(150, 100, 200)).toBe(0.5); // 50% progress
    expect(calculateProgress(100, 100, 200)).toBe(0); // 0% progress
    expect(calculateProgress(200, 100, 200)).toBe(1); // 100% progress
  });

  it('handles edge cases', () => {
    expect(calculateProgress(50, 100, 100)).toBe(0); // Invalid range
    expect(calculateProgress(250, 100, 200)).toBe(1); // Exceeding max
    expect(calculateProgress(50, 100, 200)).toBe(0); // Below min
  });
});

describe('getNextLevelThreshold', () => {
  it('returns correct threshold for next level', () => {
    expect(getNextLevelThreshold(1)).toBe(100);
    expect(getNextLevelThreshold(2)).toBe(500);
    expect(getNextLevelThreshold(3)).toBe(1500);
    expect(getNextLevelThreshold(4)).toBe(5000);
  });

  it('handles edge cases', () => {
    expect(getNextLevelThreshold(0)).toBe(100); // Invalid level
    expect(getNextLevelThreshold(10)).toBe(null); // Max level reached
  });
});

describe('formatActivityData', () => {
  const rawData = [
    { date: '2024-01-01', measurements: 10, rural: 5 },
    { date: '2024-01-02', measurements: 15, rural: 8 },
    { date: '2024-01-03', measurements: 12, rural: 6 }
  ];

  it('formats activity data correctly', () => {
    const formatted = formatActivityData(rawData);
    expect(formatted).toHaveLength(3);
    expect(formatted[0]).toHaveProperty('date');
    expect(formatted[0]).toHaveProperty('value');
    expect(formatted[0]).toHaveProperty('ruralValue');
  });

  it('handles empty data', () => {
    expect(formatActivityData([])).toEqual([]);
  });

  it('formats dates correctly', () => {
    const formatted = formatActivityData(rawData);
    expect(formatted[0].date).toMatch(/Jan 1/);
  });
});

describe('calculateAchievementProgress', () => {
  const achievement = {
    id: 'test',
    target: 100,
    progress: 75
  };

  it('calculates correct achievement progress', () => {
    expect(calculateAchievementProgress(achievement)).toBe(0.75);
  });

  it('handles completed achievements', () => {
    expect(calculateAchievementProgress({ ...achievement, progress: 100 })).toBe(1);
  });

  it('handles zero target', () => {
    expect(calculateAchievementProgress({ ...achievement, target: 0 })).toBe(0);
  });
});

describe('getRarityColor', () => {
  it('returns correct color classes for each rarity', () => {
    expect(getRarityColor('common')).toContain('gray');
    expect(getRarityColor('rare')).toContain('blue');
    expect(getRarityColor('epic')).toContain('purple');
    expect(getRarityColor('legendary')).toContain('orange');
  });

  it('handles invalid rarity', () => {
    expect(getRarityColor('invalid' as any)).toContain('gray');
  });
});

describe('sortAchievements', () => {
  const achievements = [
    { id: '1', rarity: 'common', earnedDate: '2024-01-01', progress: 100, target: 100 },
    { id: '2', rarity: 'epic', earnedDate: '2024-01-02', progress: 50, target: 100 },
    { id: '3', rarity: 'rare', earnedDate: '2024-01-03', progress: 75, target: 100 }
  ];

  it('sorts by rarity correctly', () => {
    const sorted = sortAchievements(achievements, 'rarity');
    expect(sorted[0].rarity).toBe('epic');
    expect(sorted[2].rarity).toBe('common');
  });

  it('sorts by progress correctly', () => {
    const sorted = sortAchievements(achievements, 'progress');
    expect(sorted[0].progress).toBe(100);
    expect(sorted[2].progress).toBe(50);
  });

  it('sorts by earned date correctly', () => {
    const sorted = sortAchievements(achievements, 'earned');
    expect(sorted[0].earnedDate).toBe('2024-01-03');
    expect(sorted[2].earnedDate).toBe('2024-01-01');
  });
});

describe('filterAchievements', () => {
  const achievements = [
    { id: '1', completed: true, rarity: 'common', title: 'First Achievement' },
    { id: '2', completed: false, rarity: 'epic', title: 'Second Achievement' },
    { id: '3', completed: true, rarity: 'rare', title: 'Third Achievement' }
  ];

  it('filters completed achievements', () => {
    const filtered = filterAchievements(achievements, { completed: true });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(a => a.completed)).toBe(true);
  });

  it('filters by rarity', () => {
    const filtered = filterAchievements(achievements, { rarity: 'epic' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].rarity).toBe('epic');
  });

  it('filters by search term', () => {
    const filtered = filterAchievements(achievements, { search: 'First' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('First Achievement');
  });

  it('combines multiple filters', () => {
    const filtered = filterAchievements(achievements, {
      completed: true,
      rarity: 'rare'
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('3');
  });

  it('returns all achievements when no filters applied', () => {
    const filtered = filterAchievements(achievements, {});
    expect(filtered).toHaveLength(3);
  });
});
