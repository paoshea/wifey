import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { gamificationService } from '@/lib/services/gamification-service';

// Mark route as dynamic since it uses headers
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get session first
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's leaderboard position
    const position = await gamificationService.getLeaderboardPosition(session.user.id);
    return NextResponse.json(position);
  } catch (error) {
    console.error('Error fetching leaderboard position:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
