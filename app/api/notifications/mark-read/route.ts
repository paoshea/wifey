import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/auth.config';
import { notificationService } from '@/lib/services/notification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notificationIds } = await req.json();
    
    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notificationIds format' },
        { status: 400 }
      );
    }

    await notificationService.markAsRead(notificationIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
