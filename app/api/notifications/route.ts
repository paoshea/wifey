import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/auth.config';
import { notificationService } from '@/lib/services/notification-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notifications = await notificationService.getUnreadNotifications(session.user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    const { type, title, message, metadata } = await req.json();
    
    let notification;
    switch (type) {
      case 'STREAK_REMINDER':
        notification = await notificationService.createStreakReminder(session.user.id);
        break;
      case 'ACHIEVEMENT':
        notification = await notificationService.createAchievementNotification(
          session.user.id,
          {
            title: metadata.achievementTitle,
            points: metadata.points,
            description: metadata.description || `You earned ${metadata.points} points!`,
            icon: metadata.icon
          }
        );
        break;
      case 'STREAK_MILESTONE':
        notification = await notificationService.createStreakMilestoneNotification(
          session.user.id,
          metadata.days
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
