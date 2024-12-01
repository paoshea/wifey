'use client';

import dynamic from 'next/dynamic';

// Dynamically import LanguageSwitcher with no SSR to avoid hydration issues
const LanguageSwitcher = dynamic(
  () => import('@/components/language-switcher'),
  { ssr: false }
);

export function OnboardingHeader() {
  return (
    <header className="fixed top-0 right-0 p-6 z-50">
      <div className="flex items-center justify-end">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
