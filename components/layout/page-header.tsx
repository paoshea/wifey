'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from 'components/ui/icons';
import { Button } from 'components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { cn } from 'lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu';

interface PageHeaderProps {
  locale: string;
  nav: any; // Translation function
  title: string;
  description?: string;
  showBack?: boolean;
  showLogout?: boolean;
  className?: string;
}

export function PageHeader({
  locale,
  nav,
  title,
  description,
  showBack = true,
  showLogout = true,
  className,
}: PageHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className={cn("border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900", className)}>
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Link href={`/${locale}`}>
                  <Icons.chevronLeft className="h-4 w-4 mr-2" />
                  {nav('common.back')}
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {session && (
            <div className="flex items-center space-x-2">
              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Icons.settings className="h-4 w-4 mr-2" />
                    {nav('settings')}
                    <Icons.chevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/settings`} className="w-full">
                      <Icons.settings className="mr-2 h-4 w-4" />
                      {nav('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="w-full">
                      <Icons.user className="mr-2 h-4 w-4" />
                      {nav('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/notifications`} className="w-full">
                      <Icons.bell className="mr-2 h-4 w-4" />
                      {nav('notifications.title')}
                    </Link>
                  </DropdownMenuItem>
                  {showLogout && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => signOut({ callbackUrl: `/${locale}` })}
                      >
                        <Icons.logout className="mr-2 h-4 w-4" />
                        {nav('signOut')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
