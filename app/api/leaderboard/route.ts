import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/auth.config';
import { gamificationService } from '@/lib/services/gamification-service';
import { TimeFrame } from '@/lib/gamification/types';
import { z } from 'zod';

const LeaderboardQuerySchema = z.object({
  timeframe: z.nativeEnum(TimeFrame).optional().default(TimeFrame.ALL_TIME),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  page: z.coerce.number().min(1).optional().default(1)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const query = LeaderboardQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      limit: searchParams.get('limit'),
      page: searchParams.get('page')
    });

    const response = await gamificationService.getLeaderboard(
      query.timeframe,
      query.page,
      query.limit
    );

    // Add user-specific data if authenticated
    if (session?.user?.id) {
      const userRank = await gamificationService.getUserRank(
        session.user.id,
        query.timeframe
      );
      response.userRank = userRank;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
