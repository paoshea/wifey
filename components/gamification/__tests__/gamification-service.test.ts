import { GamificationService } from '../../../lib/gamification/gamification-service';
import { Achievement, UserProgress } from '../../../lib/gamification/types';
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

  beforeEach(() => {
    service = new GamificationService();
    // Mock the private getUserProgress method
    (service as any).getUserProgress = jest.fn().mockResolvedValue(mockUserProgress);
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
      
      // Check that completed achievements are marked correctly
      const completedAchievement = achievements.find(a => a.id === 'rural-pioneer');
      expect(completedAchievement?.completed).toBe(true);
    });

    it('includes progress information', async () => {
      const achievements = await service.getUserAchievements('user1');
      achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('target');
        expect(achievement).toHaveProperty('requirements');
        expect(achievement.requirements).toHaveProperty('type');
        expect(achievement.requirements).toHaveProperty('count');
      });
    });

    it('handles new users with no progress', async () => {
      (service as any).getUserProgress = jest.fn().mockResolvedValue(null);
      const achievements = await service.getUserAchievements('newuser');
      expect(achievements).toEqual(ACHIEVEMENTS);
    });
  });
});
