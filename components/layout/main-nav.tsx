'use client';

import Link from 'next/link';
import { Icons } from 'components/ui/icons';
import { Button } from 'components/ui/button';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { MobileMenu } from './mobile-menu';
import { Logo } from 'components/brand/logo';
import { cn } from 'lib/utils';

interface MainNavProps {
    locale: string;
    nav: any; // Translation function
}

export function MainNav({ locale, nav }: MainNavProps) {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    return (
        <nav className="fixed top-0 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 z-50 shadow-sm" aria-label="Main navigation">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={`/${locale}`} className="flex items-center space-x-2 hover:opacity-90 transition-opacity" aria-label="Home">
                            <Logo size="sm" />
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        <Link
                            href={`/${locale}/wifi-finder`}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                        >
                            <Icons.wifi className="h-4 w-4" />
                            {nav('wifi')}
                        </Link>
                        <Link
                            href={`/${locale}/coverage-finder`}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                        >
                            <Icons.signal className="h-4 w-4" />
                            {nav('coverage')}
                        </Link>
                        <Link
                            href={`/${locale}/map`}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                        >
                            <Icons.map className="h-4 w-4" />
                            {nav('coverageFinder')}
                        </Link>
                        <Link
                            href={`/${locale}/leaderboard`}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                        >
                            <Icons.trophy className="h-4 w-4" />
                            {nav('leaderboard')}
                        </Link>
                    </div>

                    {/* Right Section - Auth & Actions */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {session ? (
                            <>
                                {/* Quick Report Button */}
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900"
                                >
                                    <Link href={`/${locale}/report`}>
                                        <Icons.plus className="mr-2 h-4 w-4" />
                                        {nav('report.button')}
                                    </Link>
                                </Button>

                                {/* Notifications */}
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="relative hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <Link href={`/${locale}/notifications`}>
                                        <Icons.bell className="h-5 w-5" />
                                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-600 text-[10px] font-medium text-white flex items-center justify-center">
                                            3
                                        </span>
                                        <span className="sr-only">{nav('notifications.title')}</span>
                                    </Link>
                                </Button>

                                {/* User Menu */}
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <Link href={`/${locale}/dashboard`}>
                                        <Icons.user className="h-5 w-5" />
                                        <span className="sr-only">{nav('dashboard')}</span>
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* Sign Up */}
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <Link href={`/${locale}/auth/signup`}>
                                        <Icons.userPlus className="mr-2 h-4 w-4" />
                                        {nav('register')}
                                    </Link>
                                </Button>

                                {/* Sign In */}
                                <Button
                                    asChild
                                    className="bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600"
                                >
                                    <Link href={`/${locale}/auth/signin`}>
                                        <Icons.login className="mr-2 h-4 w-4" />
                                        {nav('signIn')}
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <div className="relative w-5 h-5">
                            <span
                                className={cn(
                                    "absolute block h-0.5 w-5 bg-zinc-600 dark:bg-zinc-300 transform transition-all duration-300 ease-out",
                                    mobileMenuOpen ? "rotate-45 translate-y-2.5" : "-translate-y-1"
                                )}
                            />
                            <span
                                className={cn(
                                    "absolute block h-0.5 w-5 bg-zinc-600 dark:bg-zinc-300 transform transition-all duration-300 ease-out",
                                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                                )}
                            />
                            <span
                                className={cn(
                                    "absolute block h-0.5 w-5 bg-zinc-600 dark:bg-zinc-300 transform transition-all duration-300 ease-out",
                                    mobileMenuOpen ? "-rotate-45 translate-y-2.5" : "translate-y-1"
                                )}
                            />
                        </div>
                        <span className="sr-only">
                            {mobileMenuOpen ? nav('common.close') : nav('common.menu')}
                        </span>
                    </Button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={cn(
                        "fixed inset-x-0 top-[65px] bottom-0 bg-white dark:bg-zinc-900 lg:hidden transition-all duration-300 ease-in-out transform",
                        mobileMenuOpen
                            ? "translate-x-0 opacity-100 pointer-events-auto"
                            : "translate-x-full opacity-0 pointer-events-none"
                    )}
                    id="mobile-menu"
                >
                    <MobileMenu locale={locale} nav={nav} isOpen={mobileMenuOpen} />
                </div>
            </div>
        </nav>
    );
}
