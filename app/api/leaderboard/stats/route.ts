import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { gamificationService } from '@/lib/services/gamification-service';
import { TimeFrame } from '@/lib/gamification/types/TimeFrame';
import { z } from 'zod';

const StatsQuerySchema = z.object({
  timeframe: z.nativeEnum(TimeFrame).optional().default(TimeFrame.ALL_TIME)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const query = StatsQuerySchema.parse({
      timeframe: searchParams.get('timeframe')
    });

    const [totalUsers, totalContributions] = await Promise.all([
      gamificationService.getTotalUsers(query.timeframe),
      gamificationService.getTotalContributions(query.timeframe)
    ]);

    const stats: {
      totalUsers: number;
      totalContributions: number;
      userRank: number | null | undefined;
      userPoints: number | null | undefined;
    } = {
      totalUsers,
      totalContributions,
      userRank: undefined,
      userPoints: undefined
    };

    // Add user-specific stats if authenticated
    if (session?.user?.id) {
      const [userRank, userPoints] = await Promise.all([
        gamificationService.getUserRank(session.user.id, query.timeframe),
        gamificationService.getUserPoints(session.user.id)
      ]);

      stats.userRank = userRank;
      stats.userPoints = userPoints;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard stats' },
      { status: 500 }
    );
  }
}
