// tests/performance/measurement-processing.bench.ts

import { bench, describe } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../../lib/services/gamification-service';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const gamificationService = new GamificationService(prisma);

describe('Measurement Processing Performance Tests', () => {
  let testUserId: string;

  // Setup test data
  const setupTestData = async () => {
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Performance Test User',
        email: 'perf-test@example.com',
        hashedPassword,
        role: 'USER',
        stats: {
          create: {
            points: 0,
            stats: {
              totalMeasurements: 0,
              ruralMeasurements: 0,
              uniqueLocations: 0,
              totalDistance: 0,
              contributionScore: 0,
              qualityScore: 0,
              accuracyRate: 0,
              verifiedSpots: 0,
              helpfulActions: 0,
              consecutiveDays: 0
            }
          }
        }
      },
      include: {
        stats: true
      }
    });
    testUserId = user.id;
  };

  // Cleanup test data
  const cleanup = async () => {
    await prisma.measurement.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  };

  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('User Progress Processing', () => {
    bench('get user progress', async () => {
      await gamificationService.getUserProgress(testUserId);
    });

    bench('get user points', async () => {
      await gamificationService.getUserPoints(testUserId);
    });
  });

  describe('Achievement Processing', () => {
    bench('get achievements', async () => {
      await gamificationService.getAchievements(testUserId);
    });

    bench('process achievements with stats update', async () => {
      // Update stats first
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId }
      });

      if (!userStats) {
        throw new Error('User stats not found');
      }

      // Update stats to trigger potential achievements
      await prisma.userStats.update({
        where: { id: userStats.id },
        data: {
          points: { increment: 100 },
          stats: {
            totalMeasurements: 100,
            ruralMeasurements: 50,
            contributionScore: 1000,
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

      // Get updated achievements
      await gamificationService.getAchievements(testUserId);
    });
  });

  describe('Database Performance', () => {
    bench('update user stats', async () => {
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId }
      });

      if (!userStats) {
        throw new Error('User stats not found');
      }

      const currentStats = userStats.stats as any;
      await prisma.userStats.update({
        where: { id: userStats.id },
        data: {
          points: { increment: 10 },
          stats: {
            ...currentStats,
            totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
            ruralMeasurements: (currentStats.ruralMeasurements || 0) + 1,
            contributionScore: (currentStats.contributionScore || 0) + 10
          }
        }
      });
    });

    bench('bulk stats updates', async () => {
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId }
      });

      if (!userStats) {
        throw new Error('User stats not found');
      }

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < 10; i++) {
          const currentStats = userStats.stats as any;
          await tx.userStats.update({
            where: { id: userStats.id },
            data: {
              points: { increment: 10 },
              stats: {
                ...currentStats,
                totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
                ruralMeasurements: (currentStats.ruralMeasurements || 0) + 1,
                contributionScore: (currentStats.contributionScore || 0) + 10
              }
            }
          });
        }
      });
    });
  });

  describe('System Load Testing', () => {
    bench('high frequency stats updates (100 updates)', async () => {
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId }
      });

      if (!userStats) {
        throw new Error('User stats not found');
      }

      const startTime = Date.now();
      await Promise.all(
        Array.from({ length: 100 }, async () => {
          const currentStats = userStats.stats as any;
          await prisma.userStats.update({
            where: { id: userStats.id },
            data: {
              points: { increment: 10 },
              stats: {
                ...currentStats,
                totalMeasurements: (currentStats.totalMeasurements || 0) + 1,
                ruralMeasurements: (currentStats.ruralMeasurements || 0) + 1,
                contributionScore: (currentStats.contributionScore || 0) + 10
              }
            }
          });
        })
      );
      const endTime = Date.now();

      console.log(`Processed 100 updates in ${endTime - startTime}ms`);
    });
  });
});
