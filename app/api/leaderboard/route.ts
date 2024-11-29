import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/auth.config';
import { gamificationService } from '@/lib/services/gamification-service';
import { TimeFrame } from '@/lib/gamification/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = Number(req.nextUrl.searchParams.get('limit')) || 10;
    const timeframe = (req.nextUrl.searchParams.get('timeframe') as TimeFrame) || TimeFrame.ALL_TIME;
    const page = Number(req.nextUrl.searchParams.get('page')) || 1;

    const leaderboard = await gamificationService.getLeaderboard(timeframe, page, limit);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
