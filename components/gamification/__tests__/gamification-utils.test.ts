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
import { 
  ValidatedAchievement, 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric,
  Requirement
} from '../../../lib/gamification/types';

const mockRequirements: Requirement[] = [
  {
    type: RequirementType.STAT,
    metric: StatsMetric.RURAL_MEASUREMENTS,
    value: 1,
    operator: RequirementOperator.GREATER_THAN_EQUAL,
    description: 'Complete at least 1 rural measurement'
  },
  {
    type: RequirementType.STAT,
    metric: StatsMetric.UNIQUE_LOCATIONS,
    value: 1000,
    operator: RequirementOperator.GREATER_THAN_EQUAL,
    description: 'Map 1000 unique locations'
  },
  {
    type: RequirementType.STAT,
    metric: StatsMetric.TOTAL_MEASUREMENTS,
    value: 50,
    operator: RequirementOperator.GREATER_THAN_EQUAL,
    description: 'Complete 50 measurements in one day'
  }
];

const mockAchievements: ValidatedAchievement[] = [
  {
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    points: 100,
    tier: AchievementTier.COMMON,
    requirements: [mockRequirements[0]],
    target: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'coverage-master',
    title: 'Coverage Master',
    description: 'Map 1000 unique locations',
    icon: '📍',
    points: 500,
    tier: AchievementTier.LEGENDARY,
    requirements: [mockRequirements[1]],
    target: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 50 measurements in one day',
    icon: '⚡',
    points: 250,
    tier: AchievementTier.RARE,
    requirements: [mockRequirements[2]],
    target: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('calculateAchievementProgress', () => {
  it('calculates correct progress percentage', () => {
    const achievement = { 
      ...mockAchievements[1],
      progress: 750
    };
    expect(calculateAchievementProgress(achievement)).toBe(0.75); // 750/1000
  });

  it('caps progress at 100%', () => {
    const achievement = {
      ...mockAchievements[0],
      progress: 1
    };
    expect(calculateAchievementProgress(achievement)).toBe(1); // 1/1
  });

  it('handles zero target gracefully', () => {
    const achievement = {
      ...mockAchievements[0],
      target: 0
    };
    expect(calculateAchievementProgress(achievement)).toBe(1);
  });

  it('handles negative progress gracefully', () => {
    const achievement = {
      ...mockAchievements[0],
      progress: -1
    };
    expect(calculateAchievementProgress(achievement)).toBe(0);
  });
});

describe('isAchievementCompleted', () => {
  it('correctly identifies completed achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    const completed = achievementsWithProgress.filter(isAchievementCompleted);
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
    
    expect(getAchievementPoints(ruralPioneer)).toBe(100);
    expect(getAchievementPoints(speedDemon)).toBe(250);
  });
});

describe('getTotalPoints', () => {
  it('sums points from completed achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    expect(getTotalPoints(achievementsWithProgress)).toBe(350); // 100 + 250
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
    const sorted = sortAchievementsByRarity(mockAchievements);
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
    const completed = filterAchievementsByCompletion(achievementsWithProgress, true);
    expect(completed.length).toBe(2);
    expect(completed[0].id).toBe('rural-pioneer');
    expect(completed[1].id).toBe('speed-demon');
  });

  it('filters incomplete achievements', () => {
    const achievementsWithProgress = mockAchievements.map((achievement, index) => ({
      ...achievement,
      progress: index === 0 || index === 2 ? achievement.target : achievement.target * 0.75
    }));
    const incomplete = filterAchievementsByCompletion(achievementsWithProgress, false);
    expect(incomplete.length).toBe(1);
    expect(incomplete[0].id).toBe('coverage-master');
  });
});

describe('searchAchievements', () => {
  it('searches achievements by title', () => {
    const results = searchAchievements(mockAchievements, 'Rural');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rural-pioneer');
  });

  it('searches achievements by description', () => {
    const results = searchAchievements(mockAchievements, 'locations');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('coverage-master');
  });

  it('returns all achievements for empty search', () => {
    const results = searchAchievements(mockAchievements, '');
    expect(results.length).toBe(mockAchievements.length);
  });

  it('handles case-insensitive search', () => {
    const results = searchAchievements(mockAchievements, 'RURAL');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rural-pioneer');
  });
});
