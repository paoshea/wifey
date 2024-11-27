import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../gamification-service';
import { 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric,
  StatsContent,
  Achievement,
  LeaderboardEntry,
  UserProgress 
} from '../types';

jest.mock('@prisma/client');

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      achievement: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userStats: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userProgress: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      leaderboardEntry: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    } as any;

    gamificationService = new GamificationService(mockPrisma);
  });

  describe('getAchievements', () => {
    it('should return all achievements', async () => {
      const mockAchievements: Achievement[] = [{
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        tier: AchievementTier.COMMON,
        requirements: [{
          type: RequirementType.STAT,
          metric: StatsMetric.TOTAL_MEASUREMENTS,
          value: 10,
          operator: RequirementOperator.GREATER_THAN_EQUAL,
          description: 'Complete 10 measurements'
        }],
        target: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);

      const achievements = await gamificationService.getAchievements();
      expect(achievements).toEqual(mockAchievements);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const mockStats: StatsContent = {
        [StatsMetric.TOTAL_MEASUREMENTS]: 20,
        [StatsMetric.RURAL_MEASUREMENTS]: 5,
        [StatsMetric.VERIFIED_SPOTS]: 8,
        [StatsMetric.HELPFUL_ACTIONS]: 5,
        [StatsMetric.CONSECUTIVE_DAYS]: 7,
        [StatsMetric.QUALITY_SCORE]: 85,
        [StatsMetric.ACCURACY_RATE]: 95,
        [StatsMetric.UNIQUE_LOCATIONS]: 15,
        [StatsMetric.TOTAL_DISTANCE]: 1000,
        [StatsMetric.CONTRIBUTION_SCORE]: 75
      };

      mockPrisma.userStats.findUnique.mockResolvedValue({
        userId: 'user1',
        stats: mockStats,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const stats = await gamificationService.getUserStats('user1');
      expect(stats).toEqual(mockStats);
    });
  });

  describe('updateUserStats', () => {
    it('should update user stats', async () => {
      const mockStats: StatsContent = {
        [StatsMetric.TOTAL_MEASUREMENTS]: 20,
        [StatsMetric.RURAL_MEASUREMENTS]: 5,
        [StatsMetric.VERIFIED_SPOTS]: 8,
        [StatsMetric.HELPFUL_ACTIONS]: 5,
        [StatsMetric.CONSECUTIVE_DAYS]: 7,
        [StatsMetric.QUALITY_SCORE]: 85,
        [StatsMetric.ACCURACY_RATE]: 95,
        [StatsMetric.UNIQUE_LOCATIONS]: 15,
        [StatsMetric.TOTAL_DISTANCE]: 1000,
        [StatsMetric.CONTRIBUTION_SCORE]: 75
      };

      mockPrisma.userStats.update.mockResolvedValue({
        userId: 'user1',
        stats: mockStats,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await gamificationService.updateUserStats('user1', mockStats);
      expect(mockPrisma.userStats.update).toHaveBeenCalled();
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress', async () => {
      const mockProgress: UserProgress[] = [{
        userId: 'user1',
        achievementId: '1',
        progress: 5,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockPrisma.userProgress.findMany.mockResolvedValue(mockProgress);

      const progress = await gamificationService.getUserProgress('user1');
      expect(progress).toEqual(mockProgress);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const mockEntries: LeaderboardEntry[] = [{
        userId: 'user1',
        points: 100,
        rank: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockPrisma.leaderboardEntry.findMany.mockResolvedValue(mockEntries);

      const entries = await gamificationService.getLeaderboard();
      expect(entries).toEqual(mockEntries);
    });
  });

  describe('updateLeaderboard', () => {
    it('should update leaderboard entry', async () => {
      const mockEntry: LeaderboardEntry = {
        userId: 'user1',
        points: 100,
        rank: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.leaderboardEntry.upsert.mockResolvedValue(mockEntry);

      await gamificationService.updateLeaderboard('user1', 100);
      expect(mockPrisma.leaderboardEntry.upsert).toHaveBeenCalled();
    });
  });
});
