import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Measurement Submission Flow', () => {
  let testUserId: string;

  test.beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'E2E Test User',
        email: 'e2e-test@example.com',
      },
    });
    testUserId = user.id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  test('complete measurement submission flow', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'e2e-test@example.com');
    await page.click('button[type="submit"]');
    
    // Navigate to measurement form
    await page.goto('/measurements/new');
    
    // Fill measurement form
    await page.fill('[name="latitude"]', '40.7128');
    await page.fill('[name="longitude"]', '-74.0060');
    await page.fill('[name="signalStrength"]', '-85');
    await page.selectOption('[name="provider"]', 'Test Provider');
    
    // Submit measurement
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Measurement submitted successfully')).toBeVisible();
    
    // Check for gamification feedback
    await expect(page.locator('text=Points earned')).toBeVisible();
    
    // Verify database update
    const measurement = await prisma.measurement.findFirst({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
    });
    expect(measurement).toBeTruthy();
    
    // Check user progress update
    const progress = await prisma.userProgress.findUnique({
      where: { userId: testUserId },
    });
    expect(progress?.totalXP).toBeGreaterThan(0);
    
    // Verify leaderboard update
    const leaderboardEntry = await prisma.leaderboardEntry.findFirst({
      where: { userId: testUserId },
    });
    expect(leaderboardEntry).toBeTruthy();
  });

  test('achievement unlock notification', async ({ page }) => {
    // Create prerequisite data for achievement
    await prisma.userStats.create({
      data: {
        userId: testUserId,
        totalMeasurements: 9,
        ruralMeasurements: 4,
        contributionScore: 90,
        uniqueLocations: 9,
        totalDistance: 900,
      },
    });

    // Submit measurement that should trigger achievement
    await page.goto('/measurements/new');
    await page.fill('[name="latitude"]', '40.7128');
    await page.fill('[name="longitude"]', '-74.0060');
    await page.fill('[name="signalStrength"]', '-85');
    await page.selectOption('[name="provider"]', 'Test Provider');
    await page.click('button[type="submit"]');

    // Verify achievement notification
    await expect(page.locator('text=Achievement Unlocked')).toBeVisible();
    
    // Verify achievement in database
    const achievement = await prisma.achievement.findFirst({
      where: { userId: testUserId },
    });
    expect(achievement).toBeTruthy();
  });

  test('leaderboard position update', async ({ page }) => {
    // Get initial rank
    const initialRank = await prisma.leaderboardEntry.findFirst({
      where: { userId: testUserId },
      select: { rank: true },
    });

    // Submit high-quality measurement
    await page.goto('/measurements/new');
    await page.fill('[name="latitude"]', '40.7128');
    await page.fill('[name="longitude"]', '-74.0060');
    await page.fill('[name="signalStrength"]', '-65'); // Strong signal
    await page.selectOption('[name="provider"]', 'Test Provider');
    await page.click('button[type="submit"]');

    // Wait for leaderboard update
    await page.waitForTimeout(1000);

    // Get updated rank
    const updatedRank = await prisma.leaderboardEntry.findFirst({
      where: { userId: testUserId },
      select: { rank: true },
    });

    // Verify rank improvement
    expect(updatedRank?.rank).toBeLessThanOrEqual(initialRank?.rank || Infinity);
  });
});
