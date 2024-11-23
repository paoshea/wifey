import { PrismaClient } from '@prisma/client';
import { seedAchievements } from './achievements';

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed achievements
    await seedAchievements(prisma);

    // Add more seed functions here as needed
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
