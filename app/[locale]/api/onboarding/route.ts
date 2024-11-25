import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ONBOARDING_COOKIE } from '@/utils/onboarding';

export async function GET() {
  try {
    const onboardingComplete = cookies().get(ONBOARDING_COOKIE)?.value === 'true';
    return NextResponse.json({ onboardingComplete });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Set cookie to expire in 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    cookies().set(ONBOARDING_COOKIE, 'true', {
      expires: new Date(Date.now() + oneYear),
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
