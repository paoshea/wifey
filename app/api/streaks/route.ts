import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth.config';
import prisma from '@/lib/prisma';
import { streakService } from '@/lib/services/streak-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const streakStatus = await streakService.getStreakStatus(session.user.id);
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: session.user.id,
        type: 'streak'
      }
    });

    return NextResponse.json({
      ...streakStatus,
      achievements
    });
  } catch (error) {
    console.error('Error getting streak status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await streakService.updateStreak(session.user.id);
    
    // Get all streak achievements for the user
    const allAchievements = await prisma.achievement.findMany({
      where: {
        userId: session.user.id,
        type: 'streak'
      }
    });

    return NextResponse.json({
      streak: result.streak,
      pointsEarned: result.pointsEarned,
      multiplier: result.multiplier,
      newAchievements: result.achievements,
      allAchievements
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resetStreak = await streakService.resetStreak(session.user.id);
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: session.user.id,
        type: 'streak'
      }
    });

    return NextResponse.json({
      streak: resetStreak,
      achievements
    });
  } catch (error) {
    console.error('Error resetting streak:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
