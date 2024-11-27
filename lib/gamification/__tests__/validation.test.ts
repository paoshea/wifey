import { validateAchievement, validateUserStats, validateAchievementRequirements, calculateProgress } from '../validation';
import { 
  AchievementTier, 
  RequirementType, 
  RequirementOperator,
  StatsMetric,
  StatsContent,
  Requirement
} from '../types';

describe('Achievement Validation', () => {
  describe('validateAchievement', () => {
    it('should validate a correct achievement', () => {
      const validAchievement = {
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
      };
      expect(() => validateAchievement(invalidAchievement))
        .toThrow(/Number must be greater than 0/);
    });
  });

  describe('validateUserStats', () => {
    it('should validate correct user stats', () => {
      const validStats: StatsContent = {
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
      expect(() => validateUserStats(validStats)).not.toThrow();
    });

    it('should throw on negative counts', () => {
      const invalidStats: StatsContent = {
        [StatsMetric.TOTAL_MEASUREMENTS]: -1,
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
      expect(() => validateUserStats(invalidStats))
        .toThrow(/Number must be greater than or equal to 0/);
    });
  });

  describe('validateAchievementRequirements', () => {
    const validUserStats: StatsContent = {
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

    it('should validate total measurements requirement', () => {
      const achievement = {
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
      };
      
      expect(validateAchievementRequirements(achievement, { stats: validUserStats }))
        .toBe(true);
    });

    it('should validate rural measurements requirement', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        tier: AchievementTier.COMMON,
        requirements: [{
          type: RequirementType.STAT,
          metric: StatsMetric.RURAL_MEASUREMENTS,
          value: 3,
          operator: RequirementOperator.GREATER_THAN_EQUAL,
          description: 'Complete 3 rural measurements'
        }],
        target: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(validateAchievementRequirements(achievement, { stats: validUserStats }))
        .toBe(true);
    });
  });

  describe('calculateProgress', () => {
    const validUserStats: StatsContent = {
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

    it('should calculate correct progress for total measurements', () => {
      const achievement = {
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
      };
      
      const progress = calculateProgress(achievement, { stats: validUserStats });
      expect(progress).toBe(20);
    });

    it('should calculate correct progress for rural measurements', () => {
      const achievement = {
        id: '1',
        title: 'Test Achievement',
        description: 'Test Description',
        icon: 'test-icon',
        points: 100,
        tier: AchievementTier.COMMON,
        requirements: [{
          type: RequirementType.STAT,
          metric: StatsMetric.RURAL_MEASUREMENTS,
          value: 10,
          operator: RequirementOperator.GREATER_THAN_EQUAL,
          description: 'Complete 10 rural measurements'
        }],
        target: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const progress = calculateProgress(achievement, { stats: validUserStats });
      expect(progress).toBe(5);
    });
  });
});
