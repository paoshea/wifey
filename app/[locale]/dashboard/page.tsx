'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar';
import { Badge } from 'components/ui/badge';
import { ScrollArea } from 'components/ui/scroll-area';
import { Icons } from 'components/ui/icons';
import { Skeleton } from 'components/ui/skeleton';
import Link from 'next/link';
import { StreakCard } from 'components/gamification/streak-card';
import { AchievementsCard } from 'components/gamification/achievements-card';
import { StatsCard } from 'components/gamification/stats-card';
import { useGamification } from 'hooks/use-gamification';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLayout } from 'components/layout/page-layout';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const nav = useTranslations('navigation');
  const locale = useLocale();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { stats, achievements, isLoading, error, isAuthenticated } = useGamification();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/dashboard`);
    }
  }, [sessionStatus, router, locale]);

  // Show loading state while checking authentication
  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const notifications = [
    {
      id: 1,
      title: t('notifications.newCoverage'),
      description: t('notifications.newCoverageDesc'),
      type: 'coverage',
      time: '2h ago',
      read: false,
    },
    {
      id: 2,
      title: t('notifications.wifiSpot'),
      description: t('notifications.wifiSpotDesc'),
      type: 'wifi',
      time: '1d ago',
      read: true,
    },
    {
      id: 3,
      title: t('notifications.achievement'),
      description: t('notifications.achievementDesc'),
      type: 'achievement',
      time: '2d ago',
      read: true,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coverage':
        return <Icons.signal className="h-4 w-4 text-primary-500" />;
      case 'wifi':
        return <Icons.wifi className="h-4 w-4 text-primary-500" />;
      case 'achievement':
        return <Icons.trophy className="h-4 w-4 text-primary-500" />;
      default:
        return null;
    }
  };

  return (
    <PageLayout
      locale={locale}
      nav={nav}
      title={t('title')}
      description={t('welcome', { name: session?.user?.name || t('user') })}
      showBack={true}
      showLogout={true}
    >
      <div className="space-y-8">
        {/* User Profile Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
              <AvatarImage src={session?.user?.image || ''} className="object-cover" />
              <AvatarFallback className="bg-primary-50 text-primary-700 text-xl font-semibold">
                {session?.user?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="hover:bg-primary-50 hover:text-primary-600 transition-colors">
            <Link href={`/${locale}/settings`}>
              <Icons.settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
            {isLoading ? (
              <Card className="border-primary/10">
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <Icons.xCircle className="h-5 w-5" />
                    <p className="font-medium">Failed to load stats</p>
                  </div>
                </CardContent>
              </Card>
            ) : stats ? (
              <StatsCard
                points={stats.points}
                rank={stats.rank}
                totalContributions={stats.totalContributions}
                level={stats.level}
              />
            ) : null}

            {/* Streak and Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <Card className="border-primary/10">
                  <CardHeader>
                    <Skeleton className="h-8 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i}>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-32" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <Icons.xCircle className="h-5 w-5" />
                      <p className="font-medium">Failed to load streak data</p>
                    </div>
                  </CardContent>
                </Card>
              ) : stats ? (
                <StreakCard
                  currentStreak={stats.currentStreak}
                  longestStreak={stats.longestStreak}
                  nextMilestone={stats.nextMilestone}
                  progressToNextMilestone={stats.progressToNextMilestone}
                />
              ) : null}

              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.zap className="h-5 w-5 text-primary-500" />
                    {t('quickActions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700">
                    <Link href={`/${locale}/report`}>
                      <Icons.plus className="mr-2 h-4 w-4" />
                      {t('newReport')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full hover:bg-primary-50 hover:text-primary-600 transition-colors">
                    <Link href={`/${locale}/map`}>
                      <Icons.map className="mr-2 h-4 w-4" />
                      {t('viewMap')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            {isLoading ? (
              <Card className="border-primary/10">
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-primary/10">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <Icons.xCircle className="h-5 w-5" />
                    <p className="font-medium">Failed to load achievements</p>
                  </div>
                </CardContent>
              </Card>
            ) : achievements ? (
              <AchievementsCard achievements={achievements} />
            ) : null}
          </div>

          {/* Notifications Sidebar */}
          <div>
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icons.bell className="h-5 w-5 text-primary-500" />
                    {t('notifications.title')}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-primary-50 text-primary-700">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border border-primary/10 transition-colors ${notification.read ? 'bg-background hover:bg-primary-50/50' : 'bg-primary-50/50 hover:bg-primary-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 rounded-full bg-primary-100/50">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{notification.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
