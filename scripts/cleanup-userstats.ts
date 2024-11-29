const { PrismaClient } = require('@prisma/client');

interface UserRecord {
  id: string;
}

interface UserStatsRecord {
  _id: { $oid: string };
  userId: string;
}

async function cleanupUserStats() {
  const prisma = new PrismaClient();

  try {
    // First, get all valid user IDs
    const users = await prisma.user.findMany({
      select: { id: true }
    }) as UserRecord[];
    
    const validUserIds = new Set(users.map((u: UserRecord) => u.id));
    console.log(`Found ${validUserIds.size} valid users`);

    // Use $runCommandRaw to get all UserStats records, including those with null userId
    const allStats = await prisma.$runCommandRaw({
      find: "UserStats",
      filter: {},
      projection: { _id: 1, userId: 1 }
    }) as { cursor: { firstBatch: UserStatsRecord[] } };

    const stats = allStats.cursor.firstBatch;
    console.log(`Found ${stats.length} total UserStats records`);

    // Find orphaned stats (null userId or non-existent users)
    const orphanedStats = stats.filter((stat: UserStatsRecord) => 
      !stat.userId || !validUserIds.has(stat.userId)
    );

    if (orphanedStats.length > 0) {
      console.log(`Found ${orphanedStats.length} orphaned UserStats records`);
      
      // Delete orphaned records using raw MongoDB commands
      let deletedCount = 0;
      for (const stat of orphanedStats) {
        try {
          // Use $runCommandRaw to delete the record
          await prisma.$runCommandRaw({
            delete: "UserStats",
            deletes: [
              {
                q: { _id: stat._id },
                limit: 1
              }
            ]
          });
          deletedCount++;
          console.log(`Deleted orphaned UserStats with ID: ${stat._id.$oid} (userId: ${stat.userId || 'null'})`);
        } catch (err) {
          console.error(`Failed to delete UserStats with ID ${stat._id.$oid}:`, err);
        }
      }

      console.log(`Successfully deleted ${deletedCount} orphaned UserStats records`);
    } else {
      console.log('No orphaned UserStats records found');
    }

  } catch (error: unknown) {
    console.error('Error during cleanup:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUserStats()
  .catch(console.error);
