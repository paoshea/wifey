import { PrismaClient, UserRole } from '@prisma/client';
import { OperatorType } from './types';

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

async function main() {
  // Clean up existing data
  await prisma.measurement.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.user.deleteMany();
  await prisma.achievement.deleteMany();

  // Create achievements
  const achievements = await prisma.achievement.createMany({
    data: [
      {
        id: 'first-measurement',
        name: 'First Steps',
        description: 'Submit your first measurement',
        points: 100,
        requirements: {
          type: OperatorType.EQUALS,
          field: 'totalMeasurements',
          value: 1
        }
      },
      {
        id: 'measurement-streak',
        name: 'Consistency is Key',
        description: 'Maintain a 7-day measurement streak',
        points: 500,
        requirements: {
          type: OperatorType.EQUALS,
          field: 'consecutiveDays',
          value: 7
        }
      },
      {
        id: 'rural-explorer',
        name: 'Rural Explorer',
        description: 'Submit 10 measurements in rural areas',
        points: 300,
        requirements: {
          type: OperatorType.EQUALS,
          field: 'ruralMeasurements',
          value: 10
        }
      }
    ]
  });

  // Create users with proper relations
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.ADMIN,
      preferredLanguage: 'en'
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en'
    },
    {
      name: 'Active Contributor',
      email: 'contributor@example.com',
      hashedPassword: '$2b$10$dVflzSaF5E3v7.CUi/GhXOxhT0rliAFj.TyQF1YwNhhzpRF.kK8Hy',
      role: UserRole.USER,
      preferredLanguage: 'en'
    }
  ];

  const createdUsers = await Promise.all(
    users.map(async (userData) => {
      return prisma.user.create({
        data: {
          ...userData,
          userStats: {
            create: {
              points: userData.name === 'Active Contributor' ? 1000 : 0,
              statsData: userData.name === 'Active Contributor' 
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
          streakHistory: {
            create: {
              current: userData.name === 'Active Contributor' ? 5 : 0,
              longest: userData.name === 'Active Contributor' ? 10 : 0
            }
          }
        },
        include: {
          userStats: true,
          streakHistory: true
        }
      });
    })
  );

  console.log('Database seeded successfully');
  console.log('Created achievements:', achievements);
  console.log('Created users:', createdUsers);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });