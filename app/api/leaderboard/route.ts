import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { gamificationService } from '@/lib/services/gamification-service';
import { TimeFrame } from '@/lib/gamification/types/TimeFrame';
import { z } from 'zod';

// Mark route as dynamic since it uses request.url and headers
export const dynamic = 'force-dynamic';

const LeaderboardQuerySchema = z.object({
  timeframe: z.nativeEnum(TimeFrame).optional().default(TimeFrame.ALL_TIME),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  page: z.coerce.number().min(1).optional().default(1)
});

export async function GET(request: NextRequest) {
  try {
    // Get session first
    const session = await getServerSession(authOptions);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = LeaderboardQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      limit: searchParams.get('limit'),
      page: searchParams.get('page')
    });

    // Get leaderboard data
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
      response.userRank = userRank ?? undefined;
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
