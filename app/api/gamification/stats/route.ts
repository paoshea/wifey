import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { gamificationService } from '@/lib/services/gamification-service';
import { TimeFrame } from '@/lib/gamification/types';
import { z } from 'zod';

const StatsQuerySchema = z.object({
  timeframe: z.nativeEnum(TimeFrame).nullable().transform(val => val ?? TimeFrame.ALL_TIME)
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
      userRank: number | null;
      userPoints: number | null;
    } = {
      totalUsers,
      totalContributions,
      userRank: null,
      userPoints: null
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
