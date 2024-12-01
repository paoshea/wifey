'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimeFrame } from '@/lib/gamification/types';
import { LeaderboardEntry } from '@/lib/gamification/types';
import { getInitials } from '@/lib/utils';

async function getLeaderboardData(timeframe: TimeFrame, page: number = 1, limit: number = 10) {
  const response = await fetch(`/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard data');
  }
  
  return response.json();
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-6 w-8" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
    </TableRow>
  );
}

export function LeaderboardTable() {
  const t = useTranslations('leaderboard');
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeframe = (searchParams.get('timeframe') as TimeFrame) || TimeFrame.ALL_TIME;
  const page = Number(searchParams.get('page')) || 1;
  const limit = 10;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeframe, page],
    queryFn: () => getLeaderboardData(timeframe, page, limit),
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load leaderboard'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t('rank')}</TableHead>
            <TableHead>{t('user')}</TableHead>
            <TableHead>{t('points')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('contributions')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('streak')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: limit }).map((_, i) => (
              <LoadingRow key={i} />
            ))
          ) : (
            data?.entries.map((entry: LeaderboardEntry) => (
              <TableRow key={entry.userId}>
                <TableCell className="font-medium">
                  {entry.rank <= 3 ? (
                    <span className="text-xl">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar} alt={entry.username} />
                      <AvatarFallback>{getInitials(entry.username)}</AvatarFallback>
                    </Avatar>
                    <span>{entry.username}</span>
                  </div>
                </TableCell>
                <TableCell>{entry.points.toLocaleString()}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {entry.stats.totalMeasurements.toLocaleString()}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <span>🔥 {entry.streak?.current || 0}</span>
                    {entry.streak?.current >= 7 && (
                      <Badge variant="secondary">
                        {t('streakMilestone', { days: entry.streak.current })}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && data?.totalUsers > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('pagination.previous')}
          </Button>
          <span className="flex items-center px-4">
            {t('pagination.pageInfo', { current: page, total: Math.ceil(data.totalUsers / limit) })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil(data.totalUsers / limit)}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
