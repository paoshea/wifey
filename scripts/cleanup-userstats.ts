const { PrismaClient } = require('@prisma/client');

async function cleanupUserStats() {
  const prisma = new PrismaClient();

  try {
    // Find UserStats records and check if their users exist
    const allStats = await prisma.userStats.findMany({
      include: {
        user: true
      }
    });

    const orphanedStats = allStats.filter(stat => !stat.user);
    
    if (orphanedStats.length > 0) {
      console.log(`Found ${orphanedStats.length} orphaned UserStats records`);
      
      const deleteResult = await prisma.userStats.deleteMany({
        where: {
          id: {
            in: orphanedStats.map(stat => stat.id)
          }
        }
      });
      
      console.log(`Deleted ${deleteResult.count} orphaned UserStats records`);
    } else {
      console.log('No orphaned UserStats records found');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUserStats()
  .catch(console.error);
