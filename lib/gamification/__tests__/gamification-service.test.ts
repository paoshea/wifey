import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../gamification-service';
import { 
  ValidatedUserProgress, 
  ValidatedAchievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  StatsContent,
  Requirement,
  UserAchievement,
  UserStats
} from '../types';
import { validateAchievementRequirements } from '../validation';

interface MockPrismaClient extends PrismaClient {
  userProgress: {
    findUnique: jest.Mock<Promise<ValidatedUserProgress | null>>;
    create: jest.Mock<Promise<ValidatedUserProgress>>;
    update: jest.Mock<Promise<ValidatedUserProgress>>;
    upsert: jest.Mock<Promise<ValidatedUserProgress>>;
  };
  achievement: {
    findMany: jest.Mock<Promise<ValidatedAchievement[]>>;
    findUnique: jest.Mock<Promise<ValidatedAchievement | null>>;
  };
  userAchievement: {
    findUnique: jest.Mock<Promise<UserAchievement | null>>;
    create: jest.Mock<Promise<UserAchievement>>;
    update: jest.Mock<Promise<UserAchievement>>;
    upsert: jest.Mock<Promise<UserAchievement>>;
  };
  userStats: {
    upsert: jest.Mock<Promise<UserStats>>;
  };
  $transaction: jest.Mock<Promise<any>>;
}

const mockPrisma: jest.Mocked<MockPrismaClient> = {
  userProgress: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn()
  },
  achievement: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  userAchievement: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn()
  },
  userStats: {
    upsert: jest.fn()
  },
  $transaction: jest.fn(callback => callback(mockPrisma))
} as unknown as jest.Mocked<MockPrismaClient>;

const mockStatsContent: StatsContent = {
  [StatsMetric.TOTAL_MEASUREMENTS]: 50,
  [StatsMetric.RURAL_MEASUREMENTS]: 10,
  [StatsMetric.VERIFIED_SPOTS]: 5,
  [StatsMetric.HELPFUL_ACTIONS]: 3,
  [StatsMetric.CONSECUTIVE_DAYS]: 5,
  [StatsMetric.QUALITY_SCORE]: 80,
  [StatsMetric.ACCURACY_RATE]: 90,
  [StatsMetric.UNIQUE_LOCATIONS]: 45,
  [StatsMetric.TOTAL_DISTANCE]: 1000,
  [StatsMetric.CONTRIBUTION_SCORE]: 75
};

const mockUserProgress: ValidatedUserProgress = {
  id: 'progress-1',
  userId: 'user-1',
  totalPoints: 100,
  level: 1,
  currentXP: 50,
  totalXP: 50,
  nextLevelXP: 100,
  streak: 5,
  lastActive: new Date(),
  unlockedAchievements: 1,
  lastAchievementAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  stats: {
    id: 'stats-1',
    userProgressId: 'progress-1',
    stats: mockStatsContent,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  achievements: []
};

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
    id: 'rural-pioneer',
    title: 'Rural Pioneer',
    description: 'Complete your first rural area measurement',
    icon: '🌲',
    points: 100,
    tier: AchievementTier.COMMON,
    requirements: mockRequirements,
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
    requirements: [{
      type: RequirementType.STAT,
      metric: StatsMetric.UNIQUE_LOCATIONS,
      value: 1000,
      operator: RequirementOperator.GREATER_THAN_EQUAL,
      description: 'Map 1000 unique locations'
    }],
    target: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GamificationService(mockPrisma);

    mockPrisma.userProgress.findUnique.mockResolvedValue(mockUserProgress);
    mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
    mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
    mockPrisma.userAchievement.create.mockImplementation((data) => {
      return Promise.resolve({
        id: 'new-achievement',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  describe('updateUserStats', () => {
    const testUserId = 'test-user-id';
    const newStats = {
      totalMeasurements: 5,
      ruralMeasurements: 2
    };

    it('should update user stats and check achievements', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        ...mockUserProgress,
        stats: {
          id: 'stats-1',
          userProgressId: 'progress-1',
          stats: mockStatsContent,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
      mockPrisma.userProgress.update.mockResolvedValue(mockUserProgress);
      mockPrisma.userStats.upsert.mockResolvedValue({
        id: 'stats-1',
        userProgressId: 'progress-1',
        stats: mockStatsContent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockPrisma.userAchievement.upsert.mockResolvedValue({
        id: 'user-achievement-id',
        userProgressId: mockUserProgress.id,
        achievementId: mockAchievements[0].id,
        progress: 5,
        target: 10,
        completed: false,
        unlockedAt: null,
        notifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await service.updateUserStats(testUserId, newStats);

      expect(mockPrisma.userStats.upsert).toHaveBeenCalled();
      expect(mockPrisma.userProgress.update).toHaveBeenCalled();
      expect(mockPrisma.userAchievement.upsert).toHaveBeenCalled();
    });
  });

  describe('getAchievements', () => {
    it('should fetch and validate user achievements', async () => {
      const result = await service.getAchievements('user-1');
      expect(result).toBeDefined();
      expect(result.length).toBe(mockAchievements.length);
      expect(mockPrisma.userProgress.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          stats: true,
          achievements: {
            include: { achievement: true }
          }
        }
      });
    });

    it('should handle missing user progress', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValueOnce(null);
      await expect(service.getAchievements('user-1')).rejects.toThrow('User progress not found');
    });
  });

  describe('processMeasurement', () => {
    it('should process measurement and update stats', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: false,
        isFirstInArea: false,
        quality: 80,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });

      expect(result).toBeDefined();
      expect(result.points).toBeGreaterThan(0);
      expect(result.updatedStats[StatsMetric.TOTAL_MEASUREMENTS]).toBe(mockStatsContent[StatsMetric.TOTAL_MEASUREMENTS] + 1);
    });
  });
});
