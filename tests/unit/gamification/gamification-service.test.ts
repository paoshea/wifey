import { GamificationService } from '@lib/gamification/gamification-service';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  let mockPrisma: MockProxy<PrismaClient>;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    gamificationService = new GamificationService(mockPrisma);
  });

  describe('processMeasurement', () => {
    it('should calculate correct points for rural measurements', async () => {
      const measurement = {
        isRural: true,
        isFirstInArea: false,
        quality: 0.8,
      };

      const result = await gamificationService.processMeasurement('user123', measurement);

      expect(result.points).toBeGreaterThan(10); // Base points
      expect(result.bonuses.ruralArea).toBeDefined();
      expect(result.bonuses.qualityBonus).toBeDefined();
    });

    it('should award first-in-area bonus', async () => {
      const measurement = {
        isRural: false,
        isFirstInArea: true,
        quality: 0.8,
      };

      const result = await gamificationService.processMeasurement('user123', measurement);

      expect(result.bonuses.firstInArea).toBeDefined();
      expect(result.points).toBeGreaterThan(10);
    });

    it('should maintain streak for consecutive days', async () => {
      // Mock user progress with recent activity
      mockPrisma.userProgress.findUnique.mockResolvedValueOnce({
        userId: 'user123',
        stats: {
          consecutiveDays: 2,
          lastMeasurementDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const measurement = {
        isRural: false,
        isFirstInArea: false,
        quality: 0.8,
      };

      const result = await gamificationService.processMeasurement('user123', measurement);

      expect(result.bonuses.consistencyStreak).toBeDefined();
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard entries', async () => {
      const mockEntries = [
        { userId: 'user1', points: 100, rank: 1 },
        { userId: 'user2', points: 200, rank: 2 },
      ];

      mockPrisma.leaderboardEntry.findMany.mockResolvedValueOnce(mockEntries);

      const result = await gamificationService.getLeaderboard('daily');

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(200);
      expect(result[1].points).toBe(100);
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress with achievements', async () => {
      const mockProgress = {
        userId: 'user123',
        level: 5,
        totalPoints: 1000,
        achievements: ['FIRST_MEASUREMENT', 'RURAL_PIONEER'],
      };

      mockPrisma.userProgress.findUnique.mockResolvedValueOnce(mockProgress);

      const result = await gamificationService.getUserProgress('user123');

      expect(result).toBeDefined();
      expect(result?.level).toBe(5);
      expect(result?.achievements).toContain('RURAL_PIONEER');
    });
  });
});
