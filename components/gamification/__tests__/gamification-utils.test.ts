import {
  calculateAchievementProgress,
  getRarityColor,
  sortAchievements,
  filterAchievements,
  calculateTotalProgress,
  calculateContributionScore
} from '../../../lib/gamification/gamification-utils';
import {
  ValidatedAchievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  Requirement,
  AchievementProgress
} from '../../../lib/gamification/types';

const mockRequirements: Requirement[] = [
  {
    type: RequirementType.STAT,
    metric: StatsMetric.RURAL_MEASUREMENTS,
    value: 1,
    operator: RequirementOperator.GREATER_THAN_EQUAL,
    description: 'Complete at least 1 rural measurement'
  }
];

const mockAchievements: ValidatedAchievement[] = [
  {
    id: 'a1',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    points: 100,
    tier: AchievementTier.COMMON,
    rarity: AchievementTier.COMMON,
    requirements: [mockRequirements[0]],
    target: 1,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockAchievementProgress: AchievementProgress[] = [
  {
    id: '1',
    userProgressId: 'up1',
    achievementId: 'a1',
    progress: 75,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userProgressId: 'up1',
    achievementId: 'a2',
    progress: 100,
    isCompleted: true,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    userProgressId: 'up1',
    achievementId: 'a3',
    progress: 0,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('calculateAchievementProgress', () => {
  it('calculates correct progress percentage', () => {
    expect(calculateAchievementProgress(mockAchievementProgress[0])).toBe(0.75); // 75/100
  });

  it('caps progress at 100%', () => {
    expect(calculateAchievementProgress(mockAchievementProgress[1])).toBe(1); // 100/100
  });

  it('handles zero progress', () => {
    expect(calculateAchievementProgress(mockAchievementProgress[2])).toBe(0); // 0/100
  });
});

describe('getRarityColor', () => {
  it('returns correct color for each tier', () => {
    expect(getRarityColor(AchievementTier.COMMON)).toBe('gray');
    expect(getRarityColor(AchievementTier.RARE)).toBe('blue');
    expect(getRarityColor(AchievementTier.EPIC)).toBe('purple');
    expect(getRarityColor(AchievementTier.LEGENDARY)).toBe('orange');
  });

  it('returns common color for unknown tier', () => {
    expect(getRarityColor('UNKNOWN' as AchievementTier)).toBe('gray');
  });
});

describe('sortAchievements', () => {
  it('sorts by progress', () => {
    const sorted = sortAchievements(mockAchievementProgress, 'progress');
    expect(sorted[0]).toBe(mockAchievementProgress[1]); // 100 progress
    expect(sorted[2]).toBe(mockAchievementProgress[2]); // 0 progress
  });
});

describe('filterAchievements', () => {
  it('filters by completion status', () => {
    const completed = filterAchievements(mockAchievementProgress, { completed: true });
    expect(completed.length).toBe(1);
    expect(completed[0]).toBe(mockAchievementProgress[1]); // Only completed one
  });
});

describe('isAchievementCompleted', () => {
  it('correctly identifies completed achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    const completed = filterAchievements(achievementsWithProgress, { completed: true });
    expect(completed.length).toBe(2);
    expect(completed[0].id).toBe('rural-pioneer');
    expect(completed[1].id).toBe('speed-demon');
  });
});

describe('getAchievementPoints', () => {
  it('returns points for completed achievements', () => {
    const ruralPioneer = {
      ...mockAchievements[0],
      progress: 1
    };
    const speedDemon = {
      ...mockAchievements[2],
      progress: 50
    };

    expect(calculateContributionScore(ruralPioneer)).toBe(100);
    expect(calculateContributionScore(speedDemon)).toBe(250);
  });
});

describe('getTotalPoints', () => {
  it('sums points from completed achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    expect(calculateTotalProgress(achievementsWithProgress)).toBe(350); // 100 + 250
  });
});

describe('getRarityOrder', () => {
  it('returns correct rarity order', () => {
    expect(getRarityOrder(AchievementTier.LEGENDARY)).toBe(4);
    expect(getRarityOrder(AchievementTier.EPIC)).toBe(3);
    expect(getRarityOrder(AchievementTier.RARE)).toBe(2);
    expect(getRarityOrder(AchievementTier.COMMON)).toBe(1);
  });
});

describe('sortAchievementsByRarity', () => {
  it('sorts achievements by rarity order', () => {
    const sorted = sortAchievements(mockAchievements, 'tier');
    expect(sorted[0].tier).toBe(AchievementTier.LEGENDARY); // Coverage Master
    expect(sorted[1].tier).toBe(AchievementTier.RARE); // Speed Demon
    expect(sorted[2].tier).toBe(AchievementTier.COMMON); // Rural Pioneer
  });
});

describe('filterAchievementsByCompletion', () => {
  it('filters completed achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    const completed = filterAchievements(achievementsWithProgress, { completed: true });
    expect(completed.length).toBe(2);
    expect(completed[0].id).toBe('rural-pioneer');
    expect(completed[1].id).toBe('speed-demon');
  });

  it('filters incomplete achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    const incomplete = filterAchievements(achievementsWithProgress, { completed: false });
    expect(incomplete.length).toBe(1);
    expect(incomplete[0].id).toBe('coverage-master');
  });
});

describe('searchAchievements', () => {
  it('searches achievements by title', () => {
    const results = filterAchievements(mockAchievements, { title: 'Rural' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rural-pioneer');
  });

  it('searches achievements by description', () => {
    const results = filterAchievements(mockAchievements, { description: 'locations' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('coverage-master');
  });

  it('returns all achievements for empty search', () => {
    const results = filterAchievements(mockAchievements, {});
    expect(results.length).toBe(mockAchievements.length);
  });

  it('handles case-insensitive search', () => {
    const results = filterAchievements(mockAchievements, { title: 'RURAL' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rural-pioneer');
  });
});
