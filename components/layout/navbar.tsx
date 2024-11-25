'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Home, Signal, Wifi, Map, Users } from 'lucide-react';

const links = [
  { href: '/', label: 'home', icon: Home },
  { href: '/coverage', label: 'coverage', icon: Signal },
  { href: '/wifi', label: 'wifi', icon: Wifi },
  { href: '/explore', label: 'explore', icon: Map },
  { href: '/community', label: 'community', icon: Users }
];

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Desktop Logo */}
        <div className="mr-8 hidden md:flex items-center">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.svg"
                alt="Wifey Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Wifey
            </span>
          </Link>
        </div>

        {/* Mobile Logo */}
        <div className="mr-4 flex md:hidden items-center">
          <Link href={`/${locale}`} className="flex items-center">
            <div className="relative w-6 h-6">
              <Image
                src="/logo.svg"
                alt="Wifey Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end md:space-x-4">
          <div className="flex flex-1 items-center justify-evenly md:justify-center space-x-2 md:space-x-6">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(`/${locale}${href}`);
              const fullHref = `/${locale}${href === '/' ? '' : href}`;
              
              return (
                <Link
                  key={href}
                  href={fullHref}
                  className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">{t(label)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}