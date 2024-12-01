import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { TimeFrame } from '@/lib/gamification/types';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardStats } from './leaderboard-stats';
import { LeaderboardTimeframeSelect } from './leaderboard-timeframe-select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardView() {
  const t = useTranslations('leaderboard');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LeaderboardTimeframeSelect />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatsSkeletons />}>
          <LeaderboardStats />
        </Suspense>
      </div>

      <Card>
        <Suspense fallback={<TableSkeleton />}>
          <LeaderboardTable />
        </Suspense>
      </Card>
    </div>
  );
}

function StatsSkeletons() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-3/4" />
        </Card>
      ))}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-8 w-full mb-4" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full mb-2" />
      ))}
    </div>
  );
}
