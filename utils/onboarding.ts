import { cookies } from 'next/headers';

export const ONBOARDING_COOKIE = 'hasCompletedOnboarding';

export function setOnboardingComplete() {
  // Set cookie to expire in 1 year
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  cookies().set(ONBOARDING_COOKIE, 'true', {
    expires: new Date(Date.now() + oneYear),
    path: '/',
  });
}

export function hasCompletedOnboarding(): boolean {
  return cookies().has(ONBOARDING_COOKIE);
}

export function clearOnboardingState() {
  cookies().delete(ONBOARDING_COOKIE);
}
