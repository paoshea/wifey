import { validateAchievement, validateUserStats, validateAchievementRequirements, calculateProgress } from '../validation';

describe('Achievement Validation', () => {
  describe('validateAchievement', () => {
    it('should validate a correct achievement', () => {
      const validAchievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'MEASUREMENT_COUNT',
          threshold: 10
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(() => validateAchievement(validAchievement)).not.toThrow();
    });

    it('should throw on invalid points', () => {
      const invalidAchievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: -100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'MEASUREMENT_COUNT',
          threshold: 10
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(() => validateAchievement(invalidAchievement))
        .toThrow(/Number must be greater than 0/);
    });
  });

  describe('validateUserStats', () => {
    it('should validate correct user stats', () => {
      const validStats = {
        totalMeasurements: 20,
        ruralMeasurements: 5,
        verifiedSpots: 8,
        helpfulActions: 5,
        consecutiveDays: 7,
        qualityScore: 85,
        accuracyRate: 95,
        lastActiveAt: new Date()
      };
      expect(() => validateUserStats(validStats)).not.toThrow();
    });

    it('should throw on negative counts', () => {
      const invalidStats = {
        totalMeasurements: -1,
        ruralMeasurements: 5,
        verifiedSpots: 8,
        helpfulActions: 5,
        consecutiveDays: 7,
        qualityScore: 85,
        accuracyRate: 95,
        lastActiveAt: new Date()
      };
      expect(() => validateUserStats(invalidStats))
        .toThrow(/Number must be greater than or equal to 0/);
    });
  });

  describe('validateAchievementRequirements', () => {
    const validUserStats = {
      totalMeasurements: 20,
      ruralMeasurements: 5,
      verifiedSpots: 8,
      helpfulActions: 5,
      consecutiveDays: 7,
      qualityScore: 85,
      accuracyRate: 95,
      lastActiveAt: new Date()
    };

    it('should validate measurement count requirement', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'MEASUREMENT_COUNT',
          threshold: 10
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(validateAchievementRequirements(achievement, validUserStats))
        .toBe(true);
    });

    it('should validate rural measurements requirement', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'RURAL_MEASUREMENTS',
          threshold: 3
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(validateAchievementRequirements(achievement, validUserStats))
        .toBe(true);
    });
  });

  describe('calculateProgress', () => {
    const validUserStats = {
      totalMeasurements: 20,
      ruralMeasurements: 5,
      verifiedSpots: 8,
      helpfulActions: 5,
      consecutiveDays: 7,
      qualityScore: 85,
      accuracyRate: 95,
      lastActiveAt: new Date()
    };

    it('should calculate correct progress for measurement count', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'MEASUREMENT_COUNT',
          threshold: 10
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const { current, target } = calculateProgress(achievement, validUserStats);
      expect(current).toBe(20);
      expect(target).toBe(10);
    });

    it('should calculate correct progress for rural measurements', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        category: 'COVERAGE_PIONEER',
        tier: 'BRONZE',
        rarity: 'common',
        requirements: {
          type: 'RURAL_MEASUREMENTS',
          threshold: 10
        },
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const { current, target } = calculateProgress(achievement, validUserStats);
      expect(current).toBe(5);
      expect(target).toBe(10);
    });
  });
});
