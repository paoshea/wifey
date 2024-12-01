'use client';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Icons } from '@/components/ui/icons';
import dynamic from 'next/dynamic';

const LanguageSwitcher = dynamic(
  () => import('@/components/language-switcher'),
  { ssr: false }
);

export function AuthHeader() {
  const locale = useLocale();
  return (
    <header className="fixed top-0 w-full p-6 z-50">
      <div className="container flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-bold">Wifey</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}