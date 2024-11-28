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
      await leaderboardService.getLeaderboard('daily', 10);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('get top 100 users', async () => {
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('get user rank', async () => {
      await leaderboardService.getLeaderboard('daily', 1, 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('get leaderboard', async () => {
      await leaderboardService.getLeaderboard('daily', 1, 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });
  });

  describe('Leaderboard Updates', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
    });

    bench('single user score update', async () => {
      await prisma.leaderboardEntry.update({
        where: { userId_timeframe: { userId: testUserId, timeframe: 'daily' } },
        data: { points: Math.floor(Math.random() * 10000) },
      });
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('batch update 10 user scores', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        timeframe: 'daily' as const,
        points: Math.floor(Math.random() * 10000),
        rank: i + 1
      }));

      await prisma.leaderboardEntry.createMany({
        data: updates,
      });
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });
  });

  describe('Cache Performance', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
      // Warm up cache
      await leaderboardService.getLeaderboard('daily', 100);
    });

    bench('retrieve from cache', async () => {
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('invalidate and refresh cache', async () => {
      await prisma.leaderboardEntry.update({
        where: { userId_timeframe: { userId: testUserId, timeframe: 'daily' } },
        data: { points: Math.floor(Math.random() * 10000) },
      });
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });
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
        await prisma.leaderboardEntry.update({
          where: { userId_timeframe: { userId, timeframe: 'daily' } },
          data: { points: Math.floor(Math.random() * 10000) },
        });
      }
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('concurrent updates', async () => {
      const updates = testUserIds.map(async (userId, index) =>
        prisma.leaderboardEntry.update({
          where: { userId_timeframe: { userId, timeframe: 'daily' } },
          data: {
            points: Math.floor(Math.random() * 10000),
            rank: index + 1
          }
        })
      );
      await Promise.all(updates);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });
  });

  describe('Scale Testing', () => {
    bench('small dataset (100 users)', async () => {
      await cleanup();
      await setupTestData(100);
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('medium dataset (1000 users)', async () => {
      await cleanup();
      await setupTestData(1000);
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });

    bench('large dataset (10000 users)', async () => {
      await cleanup();
      await setupTestData(10000);
      await leaderboardService.getLeaderboard('daily', 100);
    }, { iterations: BENCH_ITERATIONS, time: BENCH_TIME });
  });
});
