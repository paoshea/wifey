import { type NextRequest } from 'next/server';
import { prisma } from 'lib/prisma';
import { NextResponse } from 'next/server';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Missing verification token' },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await prisma.user.findFirst({
      where: {
        email: verificationToken.identifier,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
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
      },
    });

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: {
        id: verificationToken.id,
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
