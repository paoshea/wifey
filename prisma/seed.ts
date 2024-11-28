// prisma/seed.ts

import { PrismaClient, UserRole } from '@prisma/client';
import { seedAchievements } from './seed/achievements';
import { WifiHotspotInput, UserInput, UserProgressInput } from './types';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.userAchievement.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.coverageHistory.deleteMany();
  await prisma.coveragePoint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wifiHotspot.deleteMany();
  await prisma.achievement.deleteMany();
  console.log('Data cleared successfully');

  // Seed WiFi Hotspots
  console.log('Seeding WiFi hotspots...');
  const wifiHotspots: WifiHotspotInput[] = [
    {
      name: 'Central Library',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610],
      },
      provider: 'Public Library',
      speed: '50 Mbps',
      isPublic: true,
    },
    {
      name: 'Community Center',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610],
      },
      provider: 'City WiFi',
      speed: '40 Mbps',
      isPublic: true,
    },
  ];

  for (const hotspot of wifiHotspots) {
    await prisma.wifiHotspot.create({
      data: hotspot,
    });
  }
  console.log('WiFi hotspots seeded successfully');

  // Seed Test Users with related data
  console.log('Seeding users...');
  const users: UserInput[] = [
    {
      name: 'Test User 1',
      email: 'test1@example.com',
      password: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy', // hashed 'password123'
      role: UserRole.USER,
      preferredLanguage: 'en',
    },
    {
      name: 'Test User 2',
      email: 'test2@example.com',
      password: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en',
    },
    {
      name: 'Test User 3',
      email: 'test3@example.com',
      password: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en',
    },
  ];

  for (const userData of users) {
    // Create user first
    const user = await prisma.user.create({
      data: userData,
    });

    // Create UserProgress with nested relations
    const userProgress: UserProgressInput = {
      user: {
        connect: {
          id: user.id
        }
      },
      level: Math.floor(Math.random() * 10) + 1,
      currentXP: Math.floor(Math.random() * 1000),
      totalXP: Math.floor(Math.random() * 2000),
      totalPoints: Math.floor(Math.random() * 5000),
      nextLevelXP: Math.floor(Math.random() * 1000) + 1000,
      unlockedAchievements: 0,
      streak: Math.floor(Math.random() * 7),
      stats: {
        create: {
          stats: {
            totalMeasurements: Math.floor(Math.random() * 100),
            ruralMeasurements: Math.floor(Math.random() * 20),
            verifiedSpots: Math.floor(Math.random() * 10),
            helpfulActions: Math.floor(Math.random() * 50),
            consecutiveDays: Math.floor(Math.random() * 7),
            qualityScore: Math.random() * 100,
            accuracyRate: Math.random() * 100,
            uniqueLocations: Math.floor(Math.random() * 30),
            totalDistance: Math.floor(Math.random() * 1000),
            contributionScore: Math.floor(Math.random() * 1000)
          }
        }
      },
      streaks: {
        create: {
          currentStreak: Math.floor(Math.random() * 7),
          lastUpdated: new Date()
        }
      }
    };

    await prisma.userProgress.create({
      data: userProgress,
    });
  }
  console.log('Users seeded successfully');

  // Seed achievements
  await seedAchievements(prisma);
  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });