import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    // TODO: Replace with actual database queries
    const stats = {
      points: 1250,
      rank: 42,
      totalContributions: 28,
      level: 5,
      currentStreak: 5,
      longestStreak: 12,
      nextMilestone: 7,
      progressToNextMilestone: 71,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
