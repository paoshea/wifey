import { PrismaClient } from '@prisma/client';
import { GamificationDB } from '@lib/services/db/gamification-db';

describe('GamificationDB Integration Tests', () => {
  let prisma: PrismaClient;
  let gamificationDB: GamificationDB;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    gamificationDB = new GamificationDB(prisma);

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('Leaderboard Operations', () => {
    beforeEach(async () => {
      // Clear leaderboard entries before each test
      await prisma.leaderboardEntry.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should create and retrieve leaderboard entries', async () => {
      const entry = await gamificationDB.getLeaderboard('daily', 10);
      expect(Array.isArray(entry)).toBe(true);
    });

    it('should calculate user rank correctly', async () => {
      // Create some test entries
      await prisma.leaderboardEntry.createMany({
        data: [
          { userId: testUserId, timeframe: 'daily', score: 100 },
          { userId: 'other1', timeframe: 'daily', score: 200 },
          { userId: 'other2', timeframe: 'daily', score: 50 },
        ],
      });

      const rank = await gamificationDB.calculateUserRank(testUserId, 'daily');
      expect(rank).toBe(2); // Should be second place
    });
  });

  describe('User Progress Operations', () => {
    beforeEach(async () => {
      // Reset user progress before each test
      await prisma.userProgress.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should track user progress correctly', async () => {
      const initialProgress = await gamificationDB.getUserProgress(testUserId);
      expect(initialProgress).toBeNull();

      // Create progress
      await prisma.userProgress.create({
        data: {
          userId: testUserId,
          level: 1,
          currentXP: 0,
          totalXP: 0,
          streak: 1,
        },
      });

      const progress = await gamificationDB.getUserProgress(testUserId);
      expect(progress).toBeDefined();
      expect(progress?.level).toBe(1);
    });

    it('should process measurements and update progress', async () => {
      const measurement = {
        userId: testUserId,
        type: 'signal',
        value: -85,
        unit: 'dBm',
        location: { type: 'Point', coordinates: [0, 0] },
        timestamp: new Date(),
        metadata: { isRural: true },
      };

      await gamificationDB.processMeasurement(measurement, testUserId);

      const progress = await gamificationDB.getUserProgress(testUserId);
      expect(progress?.totalXP).toBeGreaterThan(0);
    });
  });

  describe('Achievement Operations', () => {
    beforeEach(async () => {
      // Clear achievements before each test
      await prisma.achievement.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should unlock achievements based on criteria', async () => {
      // Create test stats that would trigger an achievement
      await prisma.userStats.create({
        data: {
          userId: testUserId,
          totalMeasurements: 10,
          ruralMeasurements: 5,
          contributionScore: 100,
          uniqueLocations: 5,
          totalDistance: 1000,
        },
      });

      const achievements = await gamificationDB.checkAchievements(testUserId);
      expect(achievements.length).toBeGreaterThan(0);
    });
  });
});
