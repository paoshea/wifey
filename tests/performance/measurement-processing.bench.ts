// tests/performance/measurement-processing.bench.ts

import { bench, describe } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../../lib/services/gamification-service';

const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);

describe('Measurement Processing Performance Tests', () => {
  let testUserId: string;

  // Setup test data
  const setupTestData = async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Performance Test User',
        email: 'perf-test@example.com',
        password: 'testpass123',
        role: 'USER'
      },
    });
    testUserId = user.id;

    // Initialize user progress
    await prisma.userProgress.create({
      data: {
        userId: testUserId,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        streak: 1,
      },
    });
  };

  // Cleanup test data
  const cleanup = async () => {
    await prisma.measurement.deleteMany({ where: { userId: testUserId } });
    await prisma.userProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  };

  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('Single Measurement Processing', () => {
    bench('process basic measurement', async () => {
      const measurement = {
        isRural: false,
        isFirstInArea: false,
        quality: 0.8,
      };

      await gamificationService.processMeasurement(testUserId, measurement);
    });

    bench('process rural measurement with bonuses', async () => {
      const measurement = {
        isRural: true,
        isFirstInArea: true,
        quality: 0.9,
      };

      await gamificationService.processMeasurement(testUserId, measurement);
    });
  });

  describe('Batch Processing', () => {
    bench('process 10 measurements in sequence', async () => {
      for (let i = 0; i < 10; i++) {
        const measurement = {
          isRural: i % 2 === 0,
          isFirstInArea: i % 3 === 0,
          quality: 0.7 + (i * 0.02),
        };

        await gamificationService.processMeasurement(testUserId, measurement);
      }
    });

    bench('process 10 measurements concurrently', async () => {
      const measurements = Array.from({ length: 10 }, (_, i) => ({
        isRural: i % 2 === 0,
        isFirstInArea: i % 3 === 0,
        quality: 0.7 + (i * 0.02),
      }));

      await Promise.all(
        measurements.map(m => gamificationService.processMeasurement(testUserId, m))
      );
    });
  });

  describe('Achievement Processing', () => {
    bench('check achievements after measurement', async () => {
      const measurement = {
        isRural: true,
        isFirstInArea: true,
        quality: 0.95,
      };

      const result = await gamificationService.processMeasurement(testUserId, measurement);
      const achievements = await prisma.achievement.findMany();
      await gamificationService.checkAchievements(
        achievements,
        result.newStats,
        { userId: testUserId, now: new Date(), tx: prisma }
      );
    });

    bench('process measurement with multiple achievement triggers', async () => {
      // Get user progress with stats
      const userProgress = await prisma.userProgress.findUnique({
        where: { userId: testUserId },
        include: { stats: true }
      });

      if (!userProgress?.stats) {
        throw new Error('User stats not found');
      }

      // Update the stats JSON field
      await prisma.userStats.update({
        where: { id: userProgress.stats.id },
        data: {
          stats: {
            totalMeasurements: 99,
            ruralMeasurements: 49,
            contributionScore: 990,
            uniqueLocations: 0,
            totalDistance: 0,
            qualityScore: 0,
            accuracyRate: 0,
            verifiedSpots: 0,
            helpfulActions: 0,
            consecutiveDays: 0
          }
        }
      });

      const measurement = {
        isRural: true,
        isFirstInArea: true,
        quality: 1.0,
      };

      await gamificationService.processMeasurement(testUserId, measurement);
    });
  });

  describe('Database Performance', () => {
    bench('update user progress and stats', async () => {
      const measurement = {
        isRural: true,
        isFirstInArea: false,
        quality: 0.85,
      };

      await prisma.$transaction(async (tx) => {
        await tx.userProgress.update({
          where: { userId: testUserId },
          data: {
            totalPoints: { increment: 10 },
            currentXP: { increment: 5 },
          },
        });

        const userProgress = await tx.userProgress.findUnique({
          where: { userId: testUserId },
          include: { stats: true }
        });

        if (!userProgress?.stats) {
          throw new Error('User stats not found');
        }

        const currentStats = userProgress.stats.stats as any;
        await tx.userStats.update({
          where: { id: userProgress.stats.id },
          data: {
            stats: {
              ...currentStats,
              totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
              ruralMeasurements: (currentStats.ruralMeasurements || 0) + 1,
              contributionScore: (currentStats.contributionScore || 0) + 10
            }
          }
        });
      });
    });

    bench('bulk progress updates', async () => {
      const updates = Array.from({ length: 10 }, () => ({
        isRural: Math.random() > 0.5,
        isFirstInArea: Math.random() > 0.7,
        quality: 0.7 + (Math.random() * 0.3),
      }));

      await prisma.$transaction(async (tx) => {
        for (const update of updates) {
          await gamificationService.processMeasurement(testUserId, update);
        }
      });
    });

    bench('sequential stats updates', async () => {
      // Process multiple measurements in sequence
      for (let i = 0; i < 10; i++) {
        const userProgress = await prisma.userProgress.findUnique({
          where: { userId: testUserId },
          include: { stats: true }
        });

        if (!userProgress?.stats) {
          throw new Error('User stats not found');
        }

        const currentStats = userProgress.stats.stats as any;
        await prisma.userStats.update({
          where: { id: userProgress.stats.id },
          data: {
            stats: {
              ...currentStats,
              totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
              ruralMeasurements: (currentStats.ruralMeasurements || 0) + 1,
              contributionScore: (currentStats.contributionScore || 0) + 10
            }
          }
        });

        await gamificationService.processMeasurement(testUserId, {
          isRural: true,
          isFirstInArea: true,
          quality: 0.95,
        });
      }
    });
  });

  describe('System Load Testing', () => {
    bench('high frequency measurements (100/sec)', async () => {
      const measurements = Array.from({ length: 100 }, () => ({
        isRural: true,
        isFirstInArea: true,
        quality: 0.95,
      }));

      // Get initial stats
      const userProgress = await prisma.userProgress.findUnique({
        where: { userId: testUserId },
        include: { stats: true }
      });

      if (!userProgress?.stats) {
        throw new Error('User stats not found');
      }

      // Update stats before processing measurements
      const currentStats = userProgress.stats.stats as any;
      await prisma.userStats.update({
        where: { id: userProgress.stats.id },
        data: {
          stats: {
            ...currentStats,
            totalMeasurements: (currentStats.totalMeasurements || 0) + measurements.length,
            ruralMeasurements: (currentStats.ruralMeasurements || 0) + measurements.length,
            contributionScore: (currentStats.contributionScore || 0) + (measurements.length * 10)
          }
        }
      });

      const startTime = Date.now();
      await Promise.all(
        measurements.map(m => gamificationService.processMeasurement(testUserId, m))
      );
      const endTime = Date.now();

      console.log(`Processed 100 measurements in ${endTime - startTime}ms`);
    });
  });
});
