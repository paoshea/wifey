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
import { useSession, signOut } from 'next-auth/react';

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
  const { data: session } = useSession();

  const navItems = [
    {
      title: t('dashboard'),
      href: '/dashboard',
      icon: <Icons.dashboard className="w-4 h-4" />,
    },
    {
      title: t('cellular'),
      href: '/cellular',
      icon: <Icons.signal className="w-4 h-4" />,
    },
    {
      title: t('wifi'),
      href: '/wifi',
      icon: <Icons.wifi className="w-4 h-4" />,
    },
    {
      title: t('coverage'),
      href: '/coverage',
      icon: <Icons.map className="w-4 h-4" />,
    },
    {
      title: t('offline'),
      href: '/offline',
      icon: <Icons.offline className="w-4 h-4" />,
    },
    {
      title: t('leaderboard'),
      href: '/leaderboard',
      icon: <Icons.trophy className="w-4 h-4" />,
    },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: `/${locale}` });
  };

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

          {/* Auth Buttons */}
          {session ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="hidden md:flex"
            >
              <Icons.logout className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link href={`/${locale}/auth/signup`}>
                  {t('register')}
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="hidden md:flex">
                <Link href={`/${locale}/auth/signin`}>
                  {t('signIn')}
                </Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Icons.menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname.includes(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
              <Link
                href={`/${locale}/settings`}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icons.settings className="w-4 h-4" />
                <span>{t('settings')}</span>
              </Link>
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icons.logout className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              ) : (
                <>
                  <Link
                    href={`/${locale}/auth/signup`}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.userPlus className="w-4 h-4" />
                    <span>{t('register')}</span>
                  </Link>
                  <Link
                    href={`/${locale}/auth/signin`}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.login className="w-4 h-4" />
                    <span>{t('signIn')}</span>
                  </Link>
                </>
              )}
              <div className="pt-4">
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
