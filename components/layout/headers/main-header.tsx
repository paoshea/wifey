'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import LanguageSwitcher with no SSR to avoid hydration issues
const LanguageSwitcher = dynamic(
  () => import('@/components/language-switcher'),
  { ssr: false }
);

export function MainHeader() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      title: t('cellular'),
      href: '/coverage',
      icon: <Icons.signal className="w-4 h-4" />,
    },
    {
      title: t('wifi'),
      href: '/wifi',
      icon: <Icons.wifi className="w-4 h-4" />,
    },
    {
      title: t('coverage'),
      href: '/explore',
      icon: <Icons.map className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold">Wifey</span>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex items-center gap-12">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                      pathname.includes(item.href)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right Side Items */}
        <div className="flex flex-1 items-center justify-end space-x-6">
          {/* Settings */}
          <Link
            href={`/${locale}/settings`}
            className={cn(
              'hidden md:flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
              pathname.includes('/settings')
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icons.settings className="w-4 h-4" />
            <span>{t('settings')}</span>
          </Link>

          {/* Language Switcher */}
          <div className="hidden md:flex">
            <LanguageSwitcher />
          </div>

          {/* Register Button */}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/auth/signup`}>
              {t('register')}
            </Link>
          </Button>

          {/* Sign In Button */}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/auth/signin`}>
              {t('login')}
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <Icons.close className="h-4 w-4" />
            ) : (
              <Icons.menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
