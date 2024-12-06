'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icons } from 'components/ui/icons';
import { Logo } from 'components/brand/logo';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'components/ui/dropdown-menu';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';
import { brandConfig } from '@/lib/branding';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { locale } = useParams();
    const t = useTranslations('header');
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 flex">
                        <Link href={`/${locale}`} className="mr-6 flex items-center space-x-2">
                            <Logo size="sm" />
                        </Link>
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <nav className="flex items-center space-x-6">
                            <Link
                                href={`/${locale}/dashboard`}
                                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary-400 after:to-primary-500 hover:after:w-full after:transition-all after:duration-300"
                            >
                                {t('dashboard')}
                            </Link>
                            <Link
                                href={`/${locale}/map`}
                                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary-400 after:to-primary-500 hover:after:w-full after:transition-all after:duration-300"
                            >
                                {t('map')}
                            </Link>
                            <Link
                                href={`/${locale}/leaderboard`}
                                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary-400 after:to-primary-500 hover:after:w-full after:transition-all after:duration-300"
                            >
                                {t('leaderboard')}
                            </Link>
                        </nav>

                        <div className="flex items-center space-x-4">
                            {/* Quick Report Button */}
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white"
                            >
                                <Link href={`/${locale}/report`}>
                                    <Icons.plus className="mr-2 h-4 w-4" />
                                    {t('quickReport')}
                                </Link>
                            </Button>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Icons.bell className="h-5 w-5" />
                                        <Badge
                                            variant="secondary"
                                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center bg-gradient-to-r from-primary-400 to-primary-500 text-white"
                                        >
                                            3
                                        </Badge>
                                        <span className="sr-only">View notifications</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <div className="flex items-center justify-between p-2">
                                        <h2 className="font-semibold">Notifications</h2>
                                        <Button variant="ghost" size="sm">
                                            Mark all as read
                                        </Button>
                                    </div>
                                    <DropdownMenuItem>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">New Coverage Point</p>
                                            <p className="text-xs text-muted-foreground">
                                                Your coverage point was added successfully!
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">Achievement Unlocked</p>
                                            <p className="text-xs text-muted-foreground">
                                                You&apos;ve earned the &apos;7-day Streak&apos; badge!
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">WiFi Point Added</p>
                                            <p className="text-xs text-muted-foreground">
                                                Thanks for adding a new WiFi point!
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Icons.user className="h-5 w-5" />
                                        <span className="sr-only">User menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <div className="flex items-center justify-start gap-2 p-2">
                                        <div className="flex flex-col space-y-1 leading-none">
                                            {session?.user?.name && (
                                                <p className="font-medium">{session.user.name}</p>
                                            )}
                                            {session?.user?.email && (
                                                <p className="w-[200px] truncate text-sm text-muted-foreground">
                                                    {session.user.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/${locale}/profile`}>
                                            <Icons.user className="mr-2 h-4 w-4" />
                                            {t('profile')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/${locale}/settings`}>
                                            <Icons.settings className="mr-2 h-4 w-4" />
                                            {t('settings')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/${locale}/auth/signout`}>
                                            <Icons.logout className="mr-2 h-4 w-4" />
                                            {t('signOut')}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
