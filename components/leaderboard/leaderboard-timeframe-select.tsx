'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeFrame } from '@/lib/gamification/types';

export function LeaderboardTimeframeSelect() {
  const t = useTranslations('leaderboard.timeframe');
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeframe = (searchParams.get('timeframe') as TimeFrame) || TimeFrame.ALL_TIME;

  const handleTimeframeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('timeframe', value);
    params.delete('page'); // Reset to first page when changing timeframe
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={timeframe} onValueChange={handleTimeframeChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('label')} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(TimeFrame).map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
