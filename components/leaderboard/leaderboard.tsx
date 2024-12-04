'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardTimeframeSelect } from './leaderboard-timeframe-select';
import { LeaderboardStats } from './leaderboard-stats';
import { TimeFrame, type LeaderboardEntry } from 'lib/gamification/types';

interface LeaderboardProps {
  initialEntries?: LeaderboardEntry[];
  refreshInterval?: number;
}

export function Leaderboard({ initialEntries = [], refreshInterval }: LeaderboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('leaderboard');

  // Get timeframe from URL or default to WEEKLY
  const timeframeParam = searchParams.get('timeframe');
  const initialTimeframe = Object.values(TimeFrame).includes(timeframeParam as TimeFrame)
    ? (timeframeParam as TimeFrame)
    : TimeFrame.WEEKLY;

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(initialTimeframe);

  const handleTimeframeChange = (timeframe: TimeFrame) => {
    const params = new URLSearchParams(searchParams);
    params.set('timeframe', timeframe);
    params.delete('page'); // Reset to first page when changing timeframe
    router.push(`?${params.toString()}`);
    setSelectedTimeframe(timeframe);
  };

  // Update state when URL changes
  useEffect(() => {
    if (timeframeParam && Object.values(TimeFrame).includes(timeframeParam as TimeFrame)) {
      setSelectedTimeframe(timeframeParam as TimeFrame);
    }
  }, [timeframeParam]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <LeaderboardTimeframeSelect
          value={selectedTimeframe}
          onChange={handleTimeframeChange}
        />
      </div>

      <LeaderboardStats timeframe={selectedTimeframe} />
      <LeaderboardTable />
    </div>
  );
}
