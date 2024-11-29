// prisma/seed.ts

import { PrismaClient, type Prisma, UserRole, OperatorType } from '@prisma/client';
import { seedAchievements } from './seed/achievements';
import prisma from '@/lib/prisma';

// Type for the default stats content
interface StatsContent {
  totalMeasurements: number;
  ruralMeasurements: number;
  uniqueLocations: number;
  totalDistance: number;
  contributionScore: number;
  qualityScore: number;
  accuracyRate: number;
  verifiedSpots: number;
  helpfulActions: number;
  consecutiveDays: number;
}

const defaultStats: StatsContent = {
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
};

async function main() {
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.achievement.deleteMany();
  await prisma.coverageReport.deleteMany();
  await prisma.wifiSpot.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.user.deleteMany();
  console.log('Data cleared successfully');

  // Seed WiFi Spots template
  console.log('Preparing WiFi spots template...');
  const wifiSpotTemplate: Omit<Prisma.WifiSpotCreateInput, 'user'> = {
    name: 'Central Library',
    latitude: 40.730610,
    longitude: -73.935242,
    speed: 50.0,
    signal: 85,
    security: 'WPA2',
    points: 10,
    verified: true
  };

  const wifiSpotTemplate2: Omit<Prisma.WifiSpotCreateInput, 'user'> = {
    name: 'Community Center',
    latitude: 40.730610,
    longitude: -73.935242,
    speed: 40.0,
    signal: 75,
    security: 'WPA2',
    points: 10,
    verified: true
  };

  // Seed Test Users
  console.log('Seeding users...');
  const users: Prisma.UserCreateInput[] = [
    {
      name: 'Test User 1',
      email: 'test1@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy', // hashed 'password123'
      role: UserRole.USER,
      preferredLanguage: 'en'
    },
    {
      name: 'Test User 2',
      email: 'test2@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en'
    },
    {
      name: 'Test User 3',
      email: 'test3@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en'
    },
  ];

  for (const userData of users) {
    // Create user
    const user = await prisma.user.create({
      data: userData,
    });

    // Create user stats
    await prisma.userStats.create({
      data: {
        userId: user.id,
        points: 0,
        stats: defaultStats
      }
    });

    // Create user streak
    await prisma.userStreak.create({
      data: {
        userId: user.id,
        current: Math.floor(Math.random() * 7),
        longest: Math.floor(Math.random() * 14),
        lastCheckin: new Date()
      }
    });

    // Create WiFi spots for user
    for (const template of [wifiSpotTemplate, wifiSpotTemplate2]) {
      await prisma.wifiSpot.create({
        data: {
          ...template,
          user: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create coverage reports
    const coverageReports: Prisma.CoverageReportCreateInput[] = [
      {
        operator: OperatorType.KOLBI,
        latitude: 40.730610,
        longitude: -73.935242,
        signal: 85,
        speed: 45.5,
        networkType: '5G',
        deviceModel: 'iPhone 13',
        connectionType: 'cellular',
        points: 10,
        user: {
          connect: {
            id: user.id
          }
        }
      },
      {
        operator: OperatorType.MOVISTAR,
        latitude: 40.730615,
        longitude: -73.935250,
        signal: 75,
        speed: 35.5,
        networkType: '4G',
        deviceModel: 'Samsung Galaxy S21',
        connectionType: 'cellular',
        points: 10,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    ];

    for (const report of coverageReports) {
      await prisma.coverageReport.create({
        data: report
      });
    }
  }
  console.log('Users and related data seeded successfully');

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