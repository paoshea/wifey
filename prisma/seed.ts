import { PrismaClient } from '@prisma/client';
import { createDefaultAchievements } from './seed/achievements';

const prisma = new PrismaClient();

const initialStatsData = {
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

// Valid role values from our schema enum
type Role = 'ADMIN' | 'MODERATOR' | 'USER';

async function main() {
  // Clean up existing data
  await prisma.measurement.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.user.deleteMany();

  // Create users first
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: 'ADMIN' as Role
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: 'USER' as Role
    },
    {
      name: 'Active Contributor',
      email: 'contributor@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: 'USER' as Role
    }
  ];

  const createdUsers = await Promise.all(
    users.map(async (userData) => {
      return prisma.user.create({
        data: {
          ...userData,
          stats: {
            create: {
              points: userData.name === 'Active Contributor' ? 1000 : 0,
              stats: userData.name === 'Active Contributor'
                ? {
                  ...initialStatsData,
                  totalMeasurements: 50,
                  uniqueLocations: 30,
                  contributionScore: 75,
                  qualityScore: 85
                }
                : initialStatsData
            }
          },
          streaks: {
            create: {
              current: userData.name === 'Active Contributor' ? 5 : 0,
              longest: userData.name === 'Active Contributor' ? 10 : 0
            }
          }
        },
        include: {
          stats: true,
          streaks: true
        }
      });
    })
  );

  // Create achievements for each user
  const achievementTemplates = [
    {
      title: 'First Steps',
      description: 'Submit your first measurement',
      points: 100,
      icon: '🎯',
      type: 'measurement',
      requirements: JSON.stringify({
        type: OperatorType.EQUALS,
        field: 'totalMeasurements',
        value: 1,
        description: 'Submit your first measurement'
      }, null, 2)
    },
    {
      title: 'Consistency is Key',
      description: 'Maintain a 7-day measurement streak',
      points: 500,
      icon: '🔥',
      type: 'streak',
      requirements: JSON.stringify({
        type: OperatorType.EQUALS,
        field: 'consecutiveDays',
        value: 7,
        description: 'Maintain a streak of 7 days'
      }, null, 2)
    },
    {
      title: 'Rural Explorer',
      description: 'Submit 10 measurements in rural areas',
      points: 300,
      icon: '🌾',
      type: 'measurement',
      requirements: JSON.stringify({
        type: OperatorType.EQUALS,
        field: 'ruralMeasurements',
        value: 10,
        description: 'Submit 10 measurements in rural areas'
      }, null, 2)
    }
  ];

  // Create achievements for each user
  const achievements = await Promise.all(
    createdUsers.flatMap(user =>
      achievementTemplates.map(template =>
        prisma.achievement.create({
          data: {
            ...template,
            userId: user.id
          }
        })
      )
    )
  );

  console.log('Database seeded successfully');
  console.log('Created users:', createdUsers);
  console.log('Created achievements:', achievements);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
