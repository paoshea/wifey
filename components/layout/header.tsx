'use client';

import { usePathname } from 'next/navigation';
import { MainHeader } from './headers/main-header';
import { OnboardingHeader } from './headers/onboarding-header';
import { AuthHeader } from './headers/auth-header';

export const Header = () => {
  const pathname = usePathname();

  if (pathname.includes('/onboarding')) {
    return <OnboardingHeader />;
  }

  if (pathname.includes('/auth')) {
    return <AuthHeader />;
  }

  return <MainHeader />;
}