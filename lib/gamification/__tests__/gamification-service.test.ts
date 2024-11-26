import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../gamification-service';
import { 
  ValidatedAchievement, 
  ValidatedUserStats,
  RequirementType,
  RarityLevel 
} from '../types';
import { mockDeep, MockProxy } from 'jest-mock-extended';

describe('GamificationService', () => {
  let prisma: MockProxy<PrismaClient>;
  let service: GamificationService;

  const mockUserId = 'test-user-id';
  const mockAchievement: ValidatedAchievement = {
    id: 'test-achievement',
    title: 'Test Achievement',
    description: 'Test Description',
    icon: '🎯',
    points: 100,
    rarity: RarityLevel.COMMON,
    requirements: [{
      type: RequirementType.MEASUREMENT_COUNT,
      value: 10,
      metric: 'measurements'
    }],
    isSecret: false,
    unlockedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserStats: ValidatedUserStats = {
    measurementCount: 15,
    ruralMeasurements: 5,
    consecutiveDays: 3,
    accuracyRate: 95,
    verifications: 10,
    lastActiveAt: new Date()
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new GamificationService(prisma);
  });

  describe('getAchievements', () => {
    it('should fetch and validate achievements', async () => {
      prisma.achievement.findMany.mockResolvedValue([{
        ...mockAchievement,
        userAchievements: []
      }]);

      const achievements = await service.getAchievements(mockUserId);

      expect(achievements).toHaveLength(1);
      expect(achievements[0]).toMatchObject(mockAchievement);
      expect(prisma.achievement.findMany).toHaveBeenCalledWith({
        include: {
          userAchievements: {
            where: { userProgress: { userId: mockUserId } }
          }
        }
      });
    });

    it('should use cache for subsequent calls', async () => {
      prisma.achievement.findMany.mockResolvedValue([{
        ...mockAchievement,
        userAchievements: []
      }]);

      await service.getAchievements(mockUserId);
      await service.getAchievements(mockUserId);

      expect(prisma.achievement.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      prisma.achievement.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.getAchievements(mockUserId))
        .rejects
        .toThrow('Failed to fetch achievements');
    });
  });

  describe('getUserStats', () => {
    it('should fetch and validate user stats', async () => {
      prisma.userStats.findUnique.mockResolvedValue(mockUserStats);

      const stats = await service.getUserStats(mockUserId);

      expect(stats).toMatchObject(mockUserStats);
      expect(prisma.userStats.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });
    });

    it('should throw if user stats not found', async () => {
      prisma.userStats.findUnique.mockResolvedValue(null);

      await expect(service.getUserStats(mockUserId))
        .rejects
        .toThrow('User stats not found');
    });
  });

  describe('checkAndUnlockAchievements', () => {
    const mockUserProgress = {
      id: 'progress-id',
      userId: mockUserId,
      totalPoints: 0
    };

    beforeEach(() => {
      prisma.achievement.findMany.mockResolvedValue([{
        ...mockAchievement,
        userAchievements: []
      }]);
      prisma.userStats.findUnique.mockResolvedValue(mockUserStats);
      prisma.userProgress.findUnique.mockResolvedValue(mockUserProgress);
    });

    it('should unlock achievements when requirements are met', async () => {
      const notifications = await service.checkAndUnlockAchievements(mockUserId);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].achievement).toMatchObject(mockAchievement);
      expect(notifications[0].pointsEarned).toBe(mockAchievement.points);
      expect(prisma.userAchievement.create).toHaveBeenCalled();
      expect(prisma.userProgress.update).toHaveBeenCalled();
    });

    it('should not unlock already unlocked achievements', async () => {
      prisma.achievement.findMany.mockResolvedValue([{
        ...mockAchievement,
        unlockedAt: new Date(),
        userAchievements: [{
          unlockedAt: new Date()
        }]
      }]);

      const notifications = await service.checkAndUnlockAchievements(mockUserId);

      expect(notifications).toHaveLength(0);
      expect(prisma.userAchievement.create).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.checkAndUnlockAchievements(mockUserId))
        .rejects
        .toThrow('Failed to check and unlock achievements');
    });
  });

  describe('updateUserStats', () => {
    const mockUpdate = {
      measurementCount: 20
    };

    beforeEach(() => {
      prisma.userStats.update.mockResolvedValue({
        ...mockUserStats,
        ...mockUpdate
      });
    });

    it('should update stats and check achievements', async () => {
      await service.updateUserStats(mockUserId, mockUpdate);

      expect(prisma.userStats.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: mockUpdate
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should invalidate cache after update', async () => {
      // Prime the cache
      prisma.userStats.findUnique.mockResolvedValue(mockUserStats);
      await service.getUserStats(mockUserId);

      // Update stats
      await service.updateUserStats(mockUserId, mockUpdate);

      // Cache should be invalidated, causing a new fetch
      await service.getUserStats(mockUserId);
      expect(prisma.userStats.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should handle update errors', async () => {
      prisma.userStats.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateUserStats(mockUserId, mockUpdate))
        .rejects
        .toThrow('Failed to update user stats');
    });
  });
});
