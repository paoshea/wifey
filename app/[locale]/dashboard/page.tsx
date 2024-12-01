'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { StreakCard } from '@/components/gamification/streak-card';
import { AchievementsCard } from '@/components/gamification/achievements-card';
import { StatsCard } from '@/components/gamification/stats-card';
import { useGamification } from '@/hooks/use-gamification';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const { data: session } = useSession();
  const { stats, achievements, isLoading, error } = useGamification();

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
        return <Icons.signal className="w-4 h-4" />;
      case 'wifi':
        return <Icons.wifi className="w-4 h-4" />;
      case 'achievement':
        return <Icons.trophy className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      {/* User Profile Section */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{t('welcome', { name: session?.user?.name || t('user') })}</h1>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/settings`}>
            <Icons.settings className="mr-2 h-4 w-4" />
            {t('settings')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 grid gap-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <Card>
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
              <Card className="p-6">
                <p className="text-destructive">Failed to load stats</p>
              </Card>
            ) : stats ? (
              <StatsCard
                points={stats.points}
                rank={stats.rank}
                totalContributions={stats.totalContributions}
                level={stats.level}
              />
            ) : null}
          </div>

          {/* Streak and Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <Card>
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
              <Card className="p-6">
                <p className="text-destructive">Failed to load streak data</p>
              </Card>
            ) : stats ? (
              <StreakCard
                currentStreak={stats.currentStreak}
                longestStreak={stats.longestStreak}
                nextMilestone={stats.nextMilestone}
                progressToNextMilestone={stats.progressToNextMilestone}
              />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.zap className="w-5 h-5 text-primary" />
                  {t('quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button asChild>
                  <Link href={`/${locale}/report`}>
                    <Icons.plus className="mr-2 h-4 w-4" />
                    {t('newReport')}
                  </Link>
                </Button>
                <Button asChild variant="outline">
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
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-8 w-8" />
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
            <Card className="p-6">
              <p className="text-destructive">Failed to load achievements</p>
            </Card>
          ) : achievements ? (
            <AchievementsCard achievements={achievements} />
          ) : null}
        </div>

        {/* Notifications Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('notifications.title')}</CardTitle>
                <Badge variant="secondary">{notifications.filter(n => !n.read).length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? 'bg-background' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
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
  );
}
