import { bench, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { LeaderboardService } from '../../lib/services/leaderboard-service';
import { GamificationService } from '../../lib/gamification/gamification-service';

const prisma = new PrismaClient();
const leaderboardService = LeaderboardService.getInstance();
const gamificationService = new GamificationService(prisma);

describe('Leaderboard Performance Tests', () => {
  // Setup: Create test data
  const setupTestData = async (userCount: number) => {
    const users = Array.from({ length: userCount }, (_, i) => ({
      id: `user${i}`,
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
    }));

    await prisma.user.createMany({ data: users });
    
    // Create random scores
    const entries = users.map(user => ({
      userId: user.id,
      timeframe: 'daily',
      score: Math.floor(Math.random() * 10000),
    }));
    
    await prisma.leaderboardEntry.createMany({ data: entries });
    return users[0].id; // Return first user ID for testing
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
      for (let i = 0; i < 10; i++) {
        await leaderboardService.getLeaderboard('daily', 10);
      }
    });

    bench('get top 100 users', async () => {
      for (let i = 0; i < 10; i++) {
        await leaderboardService.getLeaderboard('daily', 100);
      }
    });

    bench('get user rank calculation', async () => {
      for (let i = 0; i < 10; i++) {
        await leaderboardService.getUserRank(testUserId, 'daily');
      }
    });
  });

  describe('Leaderboard Updates', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
    });

    bench('single user score update', async () => {
      for (let i = 0; i < 10; i++) {
        await prisma.leaderboardEntry.update({
          where: { userId_timeframe: { userId: testUserId, timeframe: 'daily' } },
          data: { score: Math.floor(Math.random() * 10000) },
        });
      }
    });

    bench('batch update 10 user scores', async () => {
      for (let i = 0; i < 10; i++) {
        const updates = Array.from({ length: 10 }, (_, j) => ({
          userId: `user${j}`,
          timeframe: 'daily' as const,
          score: Math.floor(Math.random() * 10000),
        }));

        await prisma.leaderboardEntry.createMany({
          data: updates,
          skipDuplicates: true,
        });
      }
    });
  });

  describe('Cache Performance', () => {
    let testUserId: string;

    beforeEach(async () => {
      await cleanup();
      testUserId = await setupTestData(1000);
    });

    bench('retrieve from cache', async () => {
      // First call to populate cache
      await leaderboardService.getLeaderboard('daily', 100);
      
      // Multiple cache retrievals
      for (let i = 0; i < 10; i++) {
        await leaderboardService.getLeaderboard('daily', 100);
      }
    });

    bench('invalidate and refresh cache', async () => {
      for (let i = 0; i < 10; i++) {
        // Update score to trigger cache invalidation
        await prisma.leaderboardEntry.update({
          where: { userId_timeframe: { userId: testUserId, timeframe: 'daily' } },
          data: { score: Math.floor(Math.random() * 10000) },
        });
        // Retrieve updated leaderboard
        await leaderboardService.getLeaderboard('daily', 100);
      }
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
      }));
      await prisma.user.createMany({ data: users });
      testUserIds = users.map(u => u.id);
    });

    bench('sequential updates', async () => {
      for (let run = 0; run < 5; run++) {
        for (const userId of testUserIds) {
          await prisma.leaderboardEntry.update({
            where: { userId_timeframe: { userId, timeframe: 'daily' } },
            data: { score: Math.floor(Math.random() * 10000) },
          });
        }
      }
    });

    bench('concurrent updates', async () => {
      for (let run = 0; run < 5; run++) {
        const updates = testUserIds.map(userId => 
          prisma.leaderboardEntry.update({
            where: { userId_timeframe: { userId, timeframe: 'daily' } },
            data: { score: Math.floor(Math.random() * 10000) },
          })
        );

        await Promise.all(updates);
      }
    });
  });

  describe('Scale Testing', () => {
    bench('small dataset (100 users)', async () => {
      await cleanup();
      await setupTestData(100);
      for (let i = 0; i < 5; i++) {
        await leaderboardService.getLeaderboard('daily', 100);
      }
    });

    bench('medium dataset (1000 users)', async () => {
      await cleanup();
      await setupTestData(1000);
      for (let i = 0; i < 5; i++) {
        await leaderboardService.getLeaderboard('daily', 100);
      }
    });

    bench('large dataset (10000 users)', async () => {
      await cleanup();
      await setupTestData(10000);
      for (let i = 0; i < 5; i++) {
        await leaderboardService.getLeaderboard('daily', 100);
      }
    });
  });
});
