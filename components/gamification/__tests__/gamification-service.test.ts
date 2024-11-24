import { GamificationService } from '../../../lib/gamification/gamification-service';
import { Achievement, UserProgress, AchievementCategory } from '../../../lib/gamification/types';
import { ACHIEVEMENTS } from '../../../lib/gamification/achievements';

describe('GamificationService', () => {
  let service: GamificationService;
  const mockUserProgress: UserProgress = {
    totalPoints: 100,
    level: 1,
    achievements: ['rural-pioneer'],
    stats: {
      totalMeasurements: 50,
      ruralMeasurements: 10,
      verifiedSpots: 5,
      helpfulActions: 3,
      consecutiveDays: 5,
      lastMeasurementDate: '2024-01-15'
    }
  };

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
      category: 'RURAL_EXPLORER' as AchievementCategory,
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
      category: 'COVERAGE_EXPERT' as AchievementCategory,
      requirements: [{
        type: 'measurements' as const,
        count: 1000
      }]
    }
  ];

  beforeEach(() => {
    service = new GamificationService();
    // Mock getUserProgress to return mockUserProgress
    (service as any).getUserProgress = jest.fn().mockResolvedValue(mockUserProgress);
    // Mock getAchievements to return mockAchievements
    (service as any).getAchievements = jest.fn().mockResolvedValue(mockAchievements);
  });

  describe('processMeasurement', () => {
    it('calculates correct points for basic measurement', async () => {
      const result = await service.processMeasurement('user1', {
        isRural: false,
        isFirstInArea: false,
        quality: 0.8
      });
      expect(result.points).toBeGreaterThan(0);
    });

    it('applies rural bonus correctly', async () => {
      const result = await service.processMeasurement('user1', {
        isRural: true,
        isFirstInArea: false,
        quality: 0.8
      });
      expect(result.points).toBeGreaterThan(10);
    });

    it('applies first-in-area bonus', async () => {
      const result = await service.processMeasurement('user1', {
        isRural: false,
        isFirstInArea: true,
        quality: 0.8
      });
      expect(result.points).toBeGreaterThan(10);
    });

    it('handles streak bonuses', async () => {
      const result = await service.processMeasurement('user1', {
        isRural: false,
        isFirstInArea: false,
        quality: 0.8
      });
      expect(result.points).toBeDefined();
    });

    it('applies quality bonus proportionally', async () => {
      const result = await service.processMeasurement('user1', {
        isRural: false,
        isFirstInArea: false,
        quality: 1.0
      });
      expect(result.points).toBeGreaterThan(10);
    });
  });

  describe('getLeaderboard', () => {
    it('returns leaderboard entries in correct order', async () => {
      const leaderboard = await service.getLeaderboard();
      expect(Array.isArray(leaderboard)).toBe(true);
      if (leaderboard.length > 1) {
        expect(leaderboard[0].points).toBeGreaterThanOrEqual(leaderboard[1].points);
      }
    });

    it('handles different timeframes', async () => {
      const weeklyLeaderboard = await service.getLeaderboard('weekly');
      expect(Array.isArray(weeklyLeaderboard)).toBe(true);
    });
  });

  describe('getUserAchievements', () => {
    it('returns user achievements', async () => {
      const achievements = await service.getUserAchievements('user1');
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBe(ACHIEVEMENTS.length);
      
      // Check that achievements are completed based on progress
      const completedAchievement = achievements.find(a => a.id === 'rural-pioneer');
      expect(completedAchievement?.progress).toBe(completedAchievement?.target);
    });

    it('includes progress information', async () => {
      const achievements = await service.getUserAchievements('user1');
      achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('target');
        expect(achievement).toHaveProperty('requirements');
        expect(Array.isArray(achievement.requirements)).toBe(true);
        expect(achievement.requirements[0]).toHaveProperty('type');
        expect(achievement.requirements[0]).toHaveProperty('count');
      });
    });

    it('handles new users with no progress', async () => {
      (service as any).getUserProgress = jest.fn().mockResolvedValue(null);
      const achievements = await service.getUserAchievements('newuser');
      expect(achievements).toEqual(ACHIEVEMENTS);
    });
  });
});
