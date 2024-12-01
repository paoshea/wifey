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
    const achievements = [
      {
        id: '1',
        name: 'First Contribution',
        description: 'Made your first contribution to the network map',
        icon: 'star',
        unlocked: true,
      },
      {
        id: '2',
        name: 'Weekly Warrior',
        description: 'Maintained a 7-day contribution streak',
        icon: 'flame',
        unlocked: true,
      },
      {
        id: '3',
        name: 'Century Club',
        description: 'Earn 100 contribution points',
        icon: 'trophy',
        unlocked: false,
        progress: 75,
        total: 100,
      },
    ];

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
