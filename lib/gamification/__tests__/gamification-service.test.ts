import { PrismaClient, Achievement, UserProgress, Prisma } from '@prisma/client';
import { GamificationService } from '../../services/gamification-service';
import { 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric,
  StatsContent,
  LeaderboardEntry,
  ValidatedUserProgress,
  ValidatedAchievement
} from '../types';

jest.mock('@prisma/client');

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
      achievement: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userProgress: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      leaderboardEntry: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>;

    gamificationService = new GamificationService(mockPrisma);
  });

  describe('getAchievements', () => {
    it('should return all achievements for a user', async () => {
      const mockAchievements: Achievement[] = [{
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        type: 'TEST',
        threshold: 10,
        userId: 'user1',
        createdAt: new Date(),
        unlockedAt: null,
      }];

      const mockProgress: UserProgress = {
        id: '1',
        userId: 'user1',
        points: 0,
        level: 1,
        currentXP: 0,
        nextLevelXP: 100,
        streak: { current: 0, longest: 0 },
        stats: {
          [StatsMetric.TOTAL_MEASUREMENTS]: 0,
          [StatsMetric.VERIFIED_SPOTS]: 0,
          [StatsMetric.CONSECUTIVE_DAYS]: 0,
        } as Prisma.JsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
      mockPrisma.userProgress.findUnique.mockResolvedValue(mockProgress);

      const achievements = await gamificationService.getAchievements('user1');
      
      expect(mockPrisma.achievement.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' }
      });
      expect(achievements).toHaveLength(1);
      expect(achievements[0]).toMatchObject({
        id: '1',
        title: 'Test Achievement',
        points: 100,
      });
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress with stats', async () => {
      const mockProgress: UserProgress = {
        id: '1',
        userId: 'user1',
        points: 100,
        level: 2,
        currentXP: 150,
        nextLevelXP: 200,
        streak: { current: 3, longest: 5 },
        stats: {
          [StatsMetric.TOTAL_MEASUREMENTS]: 20,
          [StatsMetric.VERIFIED_SPOTS]: 8,
          [StatsMetric.CONSECUTIVE_DAYS]: 3,
        } as Prisma.JsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userProgress.findUnique.mockResolvedValue(mockProgress);

      const progress = await gamificationService.getUserProgress('user1');
      
      expect(mockPrisma.userProgress.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user1' }
      });
      expect(progress).toBeDefined();
      expect(progress?.points).toBe(100);
      expect(progress?.level).toBe(2);
      expect(progress?.streak.current).toBe(3);
    });

    it('should return null when user progress not found', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);

      const progress = await gamificationService.getUserProgress('user1');
      
      expect(progress).toBeNull();
    });
  });

  describe('processMeasurement', () => {
    it('should process measurement and update user progress', async () => {
      const mockMeasurement = {
        type: 'coverage',
        value: 85,
        location: { lat: 0, lng: 0 },
      };

      const mockProgress: UserProgress = {
        id: '1',
        userId: 'user1',
        points: 100,
        level: 2,
        currentXP: 150,
        nextLevelXP: 200,
        streak: { current: 3, longest: 5 },
        stats: {
          [StatsMetric.TOTAL_MEASUREMENTS]: 20,
          [StatsMetric.VERIFIED_SPOTS]: 8,
          [StatsMetric.CONSECUTIVE_DAYS]: 3,
        } as Prisma.JsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userProgress.findUnique.mockResolvedValue(mockProgress);
      mockPrisma.userProgress.update.mockResolvedValue({
        ...mockProgress,
        points: 110,
        stats: {
          [StatsMetric.TOTAL_MEASUREMENTS]: 21,
          [StatsMetric.VERIFIED_SPOTS]: 8,
          [StatsMetric.CONSECUTIVE_DAYS]: 3,
        } as Prisma.JsonValue,
      });

      const result = await gamificationService.processMeasurement('user1', mockMeasurement);
      
      expect(result).toBeDefined();
      expect(result.points).toBeGreaterThan(0);
      expect(result.newStats[StatsMetric.TOTAL_MEASUREMENTS]).toBe(21);
    });
  });
});
