import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Missing verification token' },
        { status: 400 }
      );
    }

    // Find user with matching verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });

    // Redirect to sign in page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?verified=true`
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
