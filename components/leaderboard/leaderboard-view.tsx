'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { TimeFrame } from '@/lib/gamification/types';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardStats } from './leaderboard-stats';
import { LeaderboardTimeframeSelect } from './leaderboard-timeframe-select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatsSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

export function LeaderboardView() {
  const t = useTranslations('leaderboard');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LeaderboardTimeframeSelect />
      </div>

      <Suspense fallback={<StatsSkeletons />}>
        <LeaderboardStats />
      </Suspense>

      <Card className="p-6">
        <Suspense fallback={<TableSkeleton />}>
          <LeaderboardTable />
        </Suspense>
      </Card>
    </div>
  );
}
