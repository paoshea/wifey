import { PrismaClient } from '@prisma/client';
import { seedAchievements } from './seed/achievements';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.userStreak.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wifiHotspot.deleteMany();
  await prisma.achievement.deleteMany();

  // Seed WiFi Hotspots
  const wifiHotspots = [
    {
      name: 'Central Library',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // Example coordinates
      },
      provider: 'Public Library',
      speed: '50 Mbps',
      isPublic: true,
    },
    {
      name: 'Community Center',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // Example coordinates
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

  // Seed Test Users with related data
  const users = [
    {
      name: 'Test User 1',
      email: 'test1@example.com',
    },
    {
      name: 'Test User 2',
      email: 'test2@example.com',
    },
    {
      name: 'Test User 3',
      email: 'test3@example.com',
    },
  ];

  for (const userData of users) {
    // Create user with nested relations
    await prisma.user.create({
      data: {
        ...userData,
        progress: {
          create: {
            level: Math.floor(Math.random() * 10) + 1,
            currentExp: Math.floor(Math.random() * 1000),
            totalPoints: Math.floor(Math.random() * 5000),
            nextLevelExp: Math.floor(Math.random() * 1000) + 1000,
            stats: {
              create: {
                totalMeasurements: Math.floor(Math.random() * 100),
                ruralMeasurements: Math.floor(Math.random() * 50),
                verifiedSpots: Math.floor(Math.random() * 30),
                helpfulActions: Math.floor(Math.random() * 20),
                consecutiveDays: Math.floor(Math.random() * 7),
                qualityScore: Math.random() * 100,
                accuracyRate: Math.random() * 100,
              },
            },
            streaks: {
              create: {
                currentStreak: Math.floor(Math.random() * 7),
              },
            },
          },
        },
      },
    });
  }

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