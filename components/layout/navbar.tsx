'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { UserNav } from '@/components/layout/user-nav';
import { NotificationCenter } from './notification-center';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <Icons.dashboard className="w-4 h-4" />,
    },
    {
      title: 'Map',
      href: '/map',
      icon: <Icons.map className="w-4 h-4" />,
    },
    {
      title: 'Leaderboard',
      href: '/leaderboard',
      icon: <Icons.trophy className="w-4 h-4" />,
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <Icons.user className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-bold">Wifey</span>
        </Link>

        <div className="mx-6 flex items-center space-x-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link href={item.href} className="flex items-center space-x-2">
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <NotificationCenter />
          <UserNav />
        </div>
      </div>
    </nav>
  );
}