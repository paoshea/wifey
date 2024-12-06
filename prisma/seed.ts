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
  consecutiveDays: 0,
  lastCheckin: new Date()
};

// Valid role values from our schema enum
type Role = 'ADMIN' | 'MODERATOR' | 'USER';

async function main() {
  // Clean up existing data
  await prisma.measurement.deleteMany();
  await prisma.userStats.deleteMany();
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
      const statsData = userData.name === 'Active Contributor'
        ? {
          ...initialStatsData,
          totalMeasurements: 50,
          uniqueLocations: 30,
          contributionScore: 75,
          qualityScore: 85,
          consecutiveDays: 5 // Current streak
        }
        : initialStatsData;

      return prisma.user.create({
        data: {
          ...userData,
          stats: {
            create: {
              points: userData.name === 'Active Contributor' ? 1000 : 0,
              stats: JSON.stringify(statsData)
            }
          }
        },
        include: {
          stats: true
        }
      });
    })
  );

  // Create achievements for each user using the new achievement seeding logic
  const achievements = await Promise.all(
    createdUsers.map(user => createDefaultAchievements(prisma, user.id))
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
