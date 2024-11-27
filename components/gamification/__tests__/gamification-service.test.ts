import { GamificationService } from '../../../lib/gamification/gamification-service';
import { 
  ValidatedUserProgress, 
  ValidatedAchievement,
  AchievementTier,
  RequirementType,
  RequirementOperator,
  StatsMetric,
  StatsContent,
  Requirement
} from '../../../lib/gamification/types';
import { PrismaClient } from '@prisma/client';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: PrismaClient;

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
    }
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

  const mockPrisma: jest.Mocked<PrismaClient> = {
    userProgress: {
      findUnique: jest.fn<Promise<ValidatedUserProgress | null>, [{ where: { userId: string } }]>(),
      create: jest.fn<Promise<ValidatedUserProgress>, [{ data: any }]>(),
      update: jest.fn<Promise<ValidatedUserProgress>, [{ where: { userId: string }, data: any }]>(),
      upsert: jest.fn<Promise<ValidatedUserProgress>, [{ where: { userId: string }, create: any, update: any }]>()
    },
    achievement: {
      findMany: jest.fn<Promise<ValidatedAchievement[]>, []>(),
      findUnique: jest.fn<Promise<ValidatedAchievement | null>, [{ where: { id: string } }]>()
    },
    userAchievement: {
      findUnique: jest.fn<Promise<any>, [{ where: { userId_achievementId: { userId: string, achievementId: string } } }]>(),
      create: jest.fn<Promise<any>, [{ data: any }]>(),
      update: jest.fn<Promise<any>, [{ where: { userId_achievementId: { userId: string, achievementId: string } }, data: any }]>(),
      upsert: jest.fn<Promise<any>, [{ where: { userId_achievementId: { userId: string, achievementId: string } }, create: any, update: any }]>()
    },
    userStats: {
      upsert: jest.fn<Promise<any>, [{ where: { userId: string }, create: any, update: any }]>()
    },
    $transaction: jest.fn((callback) => callback(mockPrisma))
  } as unknown as jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = mockPrisma;
    service = new GamificationService(prisma);
    // Mock prisma calls
    jest.spyOn(prisma.userProgress, 'findUnique').mockResolvedValue(mockUserProgress as any);
    jest.spyOn(prisma.achievement, 'findMany').mockResolvedValue(mockAchievements as any);
  });

  describe('processMeasurement', () => {
    it('calculates correct points for basic measurement', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: false,
        isFirstInArea: false,
        quality: 80,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });
      expect(result.points).toBeGreaterThan(0);
      expect(result.newStats[StatsMetric.TOTAL_MEASUREMENTS]).toBe(51);
    });

    it('applies rural bonus correctly', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: true,
        isFirstInArea: false,
        quality: 80,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });
      expect(result.points).toBeGreaterThan(10);
      expect(result.newStats[StatsMetric.RURAL_MEASUREMENTS]).toBe(11);
    });

    it('applies first-in-area bonus', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: false,
        isFirstInArea: true,
        quality: 80,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });
      expect(result.points).toBeGreaterThan(10);
      expect(result.newStats[StatsMetric.UNIQUE_LOCATIONS]).toBe(46);
    });

    it('handles streak bonuses', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: false,
        isFirstInArea: false,
        quality: 80,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });
      expect(result.points).toBeDefined();
      expect(result.newStats[StatsMetric.CONSECUTIVE_DAYS]).toBe(6);
    });

    it('applies quality bonus proportionally', async () => {
      const result = await service.processMeasurement('user-1', {
        isRural: false,
        isFirstInArea: false,
        quality: 100,
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      });
      expect(result.points).toBeGreaterThan(10);
      expect(result.newStats[StatsMetric.QUALITY_SCORE]).toBe(100);
    });
  });
});
