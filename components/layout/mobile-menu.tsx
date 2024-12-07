'use client';

import Link from 'next/link';
import { Icons } from 'components/ui/icons';
import { useSession } from 'next-auth/react';

interface MobileMenuProps {
    locale: string;
    nav: any; // Translation function
    isOpen: boolean;
}

export function MobileMenu({ locale, nav, isOpen }: MobileMenuProps) {
    const { data: session } = useSession();

    if (!isOpen) return null;

    return (
        <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                    href={`/${locale}/wifi-finder`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Icons.wifi className="inline-block h-4 w-4 mr-2" />
                    {nav('wifi')}
                </Link>
                <Link
                    href={`/${locale}/coverage-finder`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Icons.signal className="inline-block h-4 w-4 mr-2" />
                    {nav('coverage')}
                </Link>
                <Link
                    href={`/${locale}/map`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Icons.map className="inline-block h-4 w-4 mr-2" />
                    {nav('coverageFinder')}
                </Link>
                <Link
                    href={`/${locale}/leaderboard`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Icons.trophy className="inline-block h-4 w-4 mr-2" />
                    {nav('leaderboard')}
                </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-zinc-200 dark:border-zinc-700">
                {session ? (
                    <div className="px-2 space-y-1">
                        <Link
                            href={`/${locale}/report`}
                            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icons.plus className="inline-block h-4 w-4 mr-2" />
                            {nav('report.button')}
                        </Link>
                        <Link
                            href={`/${locale}/notifications`}
                            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icons.bell className="inline-block h-4 w-4 mr-2" />
                            {nav('notifications.title')}
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                                3
                            </span>
                        </Link>
                        <Link
                            href={`/${locale}/dashboard`}
                            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icons.user className="inline-block h-4 w-4 mr-2" />
                            {nav('dashboard')}
                        </Link>
                    </div>
                ) : (
                    <div className="px-2 space-y-1">
                        <Link
                            href={`/${locale}/auth/signup`}
                            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icons.userPlus className="inline-block h-4 w-4 mr-2" />
                            {nav('register')}
                        </Link>
                        <Link
                            href={`/${locale}/auth/signin`}
                            className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icons.login className="inline-block h-4 w-4 mr-2" />
                            {nav('signIn')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
