import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  // Seed Test Users
  const users = [
    {
      name: 'Test User 1',
      email: 'test1@example.com',
      image: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test1',
    },
    {
      name: 'Test User 2',
      email: 'test2@example.com',
      image: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test2',
    },
    {
      name: 'Test User 3',
      email: 'test3@example.com',
      image: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test3',
    },
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });

    // Create user progress
    await prisma.userProgress.create({
      data: {
        userId: createdUser.id,
        level: Math.floor(Math.random() * 10) + 1,
        currentXP: Math.floor(Math.random() * 1000),
        totalXP: Math.floor(Math.random() * 5000),
        streak: Math.floor(Math.random() * 7),
        lastActive: new Date(),
      },
    });

    // Create user stats
    await prisma.userStats.create({
      data: {
        userId: createdUser.id,
        totalMeasurements: Math.floor(Math.random() * 100),
        ruralMeasurements: Math.floor(Math.random() * 50),
        uniqueLocations: Math.floor(Math.random() * 30),
        totalDistance: Math.floor(Math.random() * 1000),
        contributionScore: Math.floor(Math.random() * 2000),
      },
    });

    // Create achievements
    const achievements = [
      'FIRST_MEASUREMENT',
      'RURAL_PIONEER',
      'CONSISTENT_CONTRIBUTOR',
      'DISTANCE_MASTER',
    ];

    for (const achievementId of achievements) {
      if (Math.random() > 0.5) {
        await prisma.achievement.create({
          data: {
            userId: createdUser.id,
            achievementId,
            unlockedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Create leaderboard entries
    const timeframes: ('daily' | 'weekly' | 'monthly' | 'allTime')[] = ['daily', 'weekly', 'monthly', 'allTime'];
    
    for (const timeframe of timeframes) {
      await prisma.leaderboardEntry.create({
        data: {
          userId: createdUser.id,
          timeframe,
          score: Math.floor(Math.random() * 10000),
          rank: Math.floor(Math.random() * 100) + 1,
        },
      });
    }
  }

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