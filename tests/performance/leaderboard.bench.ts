import { bench, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { LeaderboardService } from '../../lib/services/leaderboard-service';
import { GamificationService } from '../../lib/services/gamification-service';

const prisma = new PrismaClient();
const leaderboardService = LeaderboardService.getInstance();
const gamificationService = new GamificationService(prisma);

const BENCH_ITERATIONS = 50;
const BENCH_TIME = 1000;

describe('Leaderboard Performance Tests', () => {
  // Setup: Create test data
  const setupTestData = async (userCount: number) => {
    const users = Array.from({ length: userCount }, (_, i) => ({
      id: `user${i}`,
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
      password: 'testpassword123',
      role: 'USER' as const,
    }));

    await prisma.user.createMany({ data: users });

    // Create random scores
    const entries = users.map(user => ({
      userId: user.id,
      timeframe: 'daily',
      points: Math.floor(Math.random() * 10000),
      rank: 0, // Initial rank, will be updated
      username: user.name, // Add required username field
      measurements: 0, // Add required measurements field
      lastActive: new Date() // Add required lastActive field
    }));

    await prisma.leaderboardEntry.createMany({ data: entries });
    return users[0].id;
  };

  // Cleanup test data
  const cleanup = async () => {
    await prisma.leaderboardEntry.deleteMany();
    await prisma.user.deleteMany();
  };

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('Leaderboard Retrieval', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
    });

    bench('get top 10 users', async () => {
      await leaderboardService.getLeaderboard({ pageSize: 10 });
    });

    bench('get top 100 users', async () => {
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });

    bench('get user rank', async () => {
      await leaderboardService.getUserPosition(testUserId);
    });

    bench('get leaderboard', async () => {
      await leaderboardService.getLeaderboard({ page: 1, pageSize: 100 });
    });
  });

  describe('Leaderboard Updates', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
    });

    bench('single user score update', async () => {
      await prisma.leaderboardEntry.updateMany({
        where: {
          userId: testUserId,
          timeframe: 'daily'
        },
        data: { points: Math.floor(Math.random() * 10000) },
      });
    });

    bench('batch update 10 user scores', async () => {
      const batchUpdates = Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        timeframe: 'daily' as const,
        points: Math.floor(Math.random() * 10000),
        rank: i + 1,
        username: `Test User ${i}`,
        measurements: 0,
        lastActive: new Date()
      }));

      await prisma.leaderboardEntry.createMany({
        data: batchUpdates,
      });
    });
  });

  describe('Cache Performance', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
      // Warm up cache
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });

    bench('retrieve from cache', async () => {
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });

    bench('invalidate and refresh cache', async () => {
      await prisma.leaderboardEntry.updateMany({
        where: {
          userId: testUserId,
          timeframe: 'daily'
        },
        data: { points: Math.floor(Math.random() * 10000) },
      });
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });
  });

  describe('Concurrent Operations', () => {
    let testUserIds: string[];

    beforeEach(async () => {
      await cleanup();
      const users = Array.from({ length: 5 }, (_, i) => ({
        id: `user${i}`,
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'testpassword123',
        role: 'USER' as const,
      }));
      await prisma.user.createMany({ data: users });
      testUserIds = users.map(u => u.id);
    });

    bench('sequential updates', async () => {
      for (const userId of testUserIds) {
        await prisma.leaderboardEntry.updateMany({
          where: {
            userId,
            timeframe: 'daily'
          },
          data: { points: Math.floor(Math.random() * 10000) },
        });
      }
    });

    bench('concurrent updates', async () => {
      const concurrentUpdates = testUserIds.map((userId, index) =>
        prisma.leaderboardEntry.updateMany({
          where: {
            userId,
            timeframe: 'daily'
          },
          data: {
            points: Math.floor(Math.random() * 10000),
            rank: index + 1
          }
        })
      );
      await Promise.all(concurrentUpdates);
    });
  });

  describe('Scale Testing', () => {
    bench('small dataset (100 users)', async () => {
      await cleanup();
      await setupTestData(100);
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });

    bench('medium dataset (1000 users)', async () => {
      await cleanup();
      await setupTestData(1000);
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });

    bench('large dataset (10000 users)', async () => {
      await cleanup();
      await setupTestData(10000);
      await leaderboardService.getLeaderboard({ pageSize: 100 });
    });
  });
});
