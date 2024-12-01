'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimeFrame } from '@/lib/gamification/types';
import type { LeaderboardStats } from '@/lib/gamification/types';

async function getLeaderboardStats(timeframe: TimeFrame): Promise<LeaderboardStats> {
  const response = await fetch(`/api/leaderboard/stats?timeframe=${timeframe}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard stats');
  }
  return response.json();
}

export function LeaderboardStats() {
  const t = useTranslations('leaderboard.stats');
  const searchParams = useSearchParams();
  const timeframe = (searchParams.get('timeframe') as TimeFrame) || TimeFrame.ALL_TIME;

  const { data: stats, isLoading, error } = useQuery<LeaderboardStats>({
    queryKey: ['leaderboardStats', timeframe],
    queryFn: () => getLeaderboardStats(timeframe),
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load stats'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalUsers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.totalUsers.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalContributions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {stats?.totalContributions.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {stats?.userRank && (
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('yourRank')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                #{stats.userRank.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {stats?.userPoints && (
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('yourPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.userPoints.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
